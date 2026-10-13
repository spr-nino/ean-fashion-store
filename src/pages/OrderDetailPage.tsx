import {useEffect,useReducer,useState} from 'react';
import type {ReactNode} from 'react';
import {useParams} from 'react-router-dom';
import {CheckCircle2,CreditCard,Package,Truck,XCircle} from 'lucide-react';
import {products} from '../data/products';
import {getCountryName} from '../data/shipping';
import {useStore} from '../context/useStore';
import {ORDER_STATUS_LABELS} from '../context/store';
import type {Order} from '../context/store';
import {Button,LinkButton} from '../components/ui';

type Step={key:string;label:string;at?:string;hint:string;icon:ReactNode};

const fmt=(iso:string)=>{
  const d=new Date(iso);
  const pad=(n:number)=>String(n).padStart(2,'0');
  return `${d.getFullYear()}-${pad(d.getMonth()+1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

const stepsOf=(order:Order):Step[]=>{
  if(order.status==='cancelled')return [
    {key:'placed',label:'已下单',at:order.createdAt,hint:'订单已提交',icon:<Package size={14} aria-hidden="true"/>},
    {key:'cancelled',label:'已取消',at:order.cancelledAt,hint:'订单已关闭',icon:<XCircle size={14} aria-hidden="true"/>},
  ];
  return [
    {key:'placed',label:'已下单',at:order.createdAt,hint:'订单已提交',icon:<Package size={14} aria-hidden="true"/>},
    {key:'paid',label:'已付款',at:order.paidAt,hint:'等待模拟支付',icon:<CreditCard size={14} aria-hidden="true"/>},
    {key:'shipped',label:'已发货',at:order.shippedAt,hint:order.status==='paid'?'演示订单将在付款约 1 分钟后自动发货':'等待仓库发货',icon:<Truck size={14} aria-hidden="true"/>},
    {key:'done',label:'已完成',at:order.confirmedAt,hint:'包裹送达后请确认收货',icon:<CheckCircle2 size={14} aria-hidden="true"/>},
  ];
};

export default function OrderDetailPage(){
  const {id}=useParams();
  const {orders,confirmOrder,cancelOrder}=useStore();
  const [confirmCancel,setConfirmCancel]=useState(false);
  // 付款满一分钟自动发货靠读出时推导,这里定时触发重渲染让页面自己往前走。
  const [,tick]=useReducer((x:number)=>x+1,0);
  useEffect(()=>{
    const timer=window.setInterval(tick,5000);
    return()=>window.clearInterval(timer);
  },[]);

  const order=orders.find(o=>o.id===id);
  if(!order)return <main className="empty"><p>订单不存在或已被清除。</p><LinkButton to="/account" variant="secondary">返回账户</LinkButton></main>;

  const steps=stepsOf(order);
  const doneCount=steps.filter(step=>step.at).length;
  const cancelled=order.status==='cancelled';
  const shippingFee=order.shippingFee??0;
  const subtotal=order.subtotal??order.total-shippingFee;

  const requestCancel=()=>{
    if(confirmCancel){cancelOrder(order.id);setConfirmCancel(false);return}
    setConfirmCancel(true);
    window.setTimeout(()=>setConfirmCancel(current=>current?false:current),2600);
  };

  return <main className="orderDetail" aria-labelledby="order-title">
    <small>EAN ORDER</small>
    <div className="orderDetailHead">
      <h1 id="order-title">订单 {order.id}</h1>
      <span className={`statusBadge statusBadge--${order.status}`}>{ORDER_STATUS_LABELS[order.status]}</span>
    </div>

    {cancelled
      ?<p className="orderCancelled"><XCircle size={16} aria-hidden="true"/>订单已于{order.cancelledAt?` ${fmt(order.cancelledAt)} `:''}取消。</p>
      :<ol className="orderStepper" aria-label="订单进度">
        {steps.map((step,index)=><li key={step.key} className={step.at?'done':index===doneCount?'current':''}>
          <span className="orderStepper__dot" aria-hidden="true"/>
          <span className="orderStepper__label">{step.label}</span>
          {step.at&&<time className="orderStepper__time" dateTime={step.at}>{fmt(step.at)}</time>}
        </li>)}
      </ol>}

    <section aria-labelledby="order-timeline-title">
      <h2 id="order-timeline-title">订单跟踪</h2>
      <ol className="orderTimeline">
        {steps.map(step=><li key={step.key} className={step.at?'done':''}>
          <span className="orderTimeline__dot" aria-hidden="true">{step.icon}</span>
          <div>
            <strong>{step.label}</strong>
            <p>{step.at?fmt(step.at):step.hint}</p>
          </div>
        </li>)}
      </ol>
    </section>

    <section aria-labelledby="order-items-title">
      <h2 id="order-items-title">商品清单</h2>
      <ul className="orderItems">
        {order.items.map(item=>{
          const product=products.find(p=>p.id===item.productId);
          return <li key={item.id}>
            {product&&<img src={product.images[0]} alt={product.name}/>}
            <div className="orderItems__meta">
              <strong>{product?.name??item.productId}</strong>
              <span>{item.color} / {item.size} × {item.qty}</span>
            </div>
            <span>¥ {(item.price*item.qty).toLocaleString()}</span>
          </li>;
        })}
      </ul>
    </section>

    <section aria-labelledby="order-receiver-title">
      <h2 id="order-receiver-title">收货信息</h2>
      {order.address
        ?<div className="orderReceiver">
          <p className="orderReceiver__name">{order.address.name}　{order.address.phone}</p>
          <p>{order.address.detail}，{order.address.city}，{order.address.province} {order.address.postcode}，{getCountryName(order.address.country)}</p>
        </div>
        :<p className="orderHint">演示订单（早期数据，未保存收货信息）。</p>}
    </section>

    <section aria-labelledby="order-cost-title">
      <h2 id="order-cost-title">费用明细</h2>
      <div className="summaryRow"><span>商品金额</span><span>¥ {subtotal.toLocaleString()}</span></div>
      <div className="summaryRow"><span>运费</span><span>{shippingFee===0?'免费':`¥ ${shippingFee.toLocaleString()}`}</span></div>
      <div className="summaryRow summaryTotal"><span>合计</span><strong>¥ {order.total.toLocaleString()}</strong></div>
    </section>

    <div className="orderActions">
      {order.status==='pending'&&<>
        <LinkButton to={`/payment/${order.id}`} variant="primary" size="lg" leadingIcon={<CreditCard size={15} aria-hidden="true"/>}>去支付　¥ {order.total.toLocaleString()}</LinkButton>
        <Button variant={confirmCancel?'danger':'text'} size="md" onClick={requestCancel}>{confirmCancel?'确认取消?':'取消订单'}</Button>
      </>}
      {order.status==='shipped'&&<Button variant="primary" size="lg" leadingIcon={<CheckCircle2 size={15} aria-hidden="true"/>} onClick={()=>confirmOrder(order.id)}>确认收货</Button>}
      <LinkButton to="/account" variant="text" size="sm">返回订单列表</LinkButton>
    </div>
  </main>;
}
