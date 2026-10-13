import {useState} from 'react';
import {useNavigate,useParams} from 'react-router-dom';
import {CheckCircle2,CreditCard,ShieldCheck,Timer,XCircle} from 'lucide-react';
import {Button,LinkButton} from '../components/ui';
import {useStore} from '../context/useStore';
import {ORDER_STATUS_LABELS,paymentRemainingMs} from '../context/store';
import {paymentProvider} from '../payments';

export default function PaymentPage(){
  const {id}=useParams();
  const {orders,payOrder,cancelOrder}=useStore();
  const nav=useNavigate();
  const [loading,setLoading]=useState(false);
  const [simulateFailure,setSimulateFailure]=useState(false);
  const [error,setError]=useState('');
  const [confirmCancel,setConfirmCancel]=useState(false);

  const order=orders.find(o=>o.id===id);
  if(!order)return <main className="empty"><p>订单不存在或已被清除。</p><LinkButton to="/shop" variant="secondary">返回商店</LinkButton></main>;

  if(order.status!=='pending'){
    const cancelled=order.status==='cancelled';
    return <main className="paymentPage" aria-labelledby="payment-title">
      <small>EAN CASHIER</small>
      <h1 id="payment-title">{cancelled?'订单已取消':'订单无需支付'}</h1>
      <p className="notice">
        {cancelled?<XCircle size={16} aria-hidden="true"/>:<CheckCircle2 size={16} aria-hidden="true"/>}
        订单 {order.id} 当前状态：{ORDER_STATUS_LABELS[order.status]}
      </p>
      <div className="paymentActions">
        <LinkButton to={`/orders/${order.id}`} variant="primary">查看订单详情</LinkButton>
        <LinkButton to="/shop" variant="text" size="sm">返回商店</LinkButton>
      </div>
    </main>;
  }

  const shippingFee=order.shippingFee??0;
  const subtotal=order.subtotal??order.total-shippingFee;
  const minutes=Math.max(1,Math.ceil(paymentRemainingMs(order)/60_000));

  const pay=async()=>{
    if(loading)return;
    setError('');
    setLoading(true);
    const result=await paymentProvider.pay({orderId:order.id,amount:order.total},{simulateFailure});
    setLoading(false);
    if(result.status==='paid'){
      payOrder(order.id);
      nav('/order-success',{state:{...order,status:'paid',paidAt:new Date().toISOString()}});
    }else{
      setError(result.message??'支付失败，请重试');
    }
  };

  const requestCancel=()=>{
    if(confirmCancel){cancelOrder(order.id);setConfirmCancel(false);return}
    setConfirmCancel(true);
    window.setTimeout(()=>setConfirmCancel(current=>current?false:current),2600);
  };

  return <main className="paymentPage" aria-labelledby="payment-title">
    <small>EAN CASHIER</small>
    <h1 id="payment-title">模拟收银台</h1>
    <p className="notice"><ShieldCheck size={16} aria-hidden="true"/>演示支付，不会产生真实扣款。</p>

    <div className="paymentCard" aria-label="应付明细">
      <div className="summaryRow"><span>订单编号</span><span>{order.id}</span></div>
      <div className="summaryRow"><span>商品金额</span><span>¥ {subtotal.toLocaleString()}</span></div>
      <div className="summaryRow"><span>运费</span><span>{shippingFee===0?'免费':`¥ ${shippingFee.toLocaleString()}`}</span></div>
      <div className="summaryRow summaryTotal"><span>应付合计</span><strong>¥ {order.total.toLocaleString()}</strong></div>
    </div>

    {order.address&&<p className="paymentMeta">{order.address.name}　{order.address.phone} · {order.address.detail}，{order.address.city}</p>}
    <p className="paymentTimer"><Timer size={14} aria-hidden="true"/>请在 {minutes} 分钟内完成支付，超时订单将自动取消。</p>

    {paymentProvider.capabilities.simulation&&<label className="paymentSim">
      <input type="checkbox" checked={simulateFailure} onChange={event=>setSimulateFailure(event.target.checked)}/>
      模拟支付失败（演示失败重试路径）
    </label>}

    {error&&<p className="error" role="alert" aria-live="assertive">{error}</p>}

    <div className="paymentActions">
      <Button variant="primary" size="lg" loading={loading} loadingLabel="正在支付" leadingIcon={loading?undefined:<CreditCard size={15} aria-hidden="true"/>} onClick={pay}>确认支付　¥ {order.total.toLocaleString()}</Button>
      <Button variant={confirmCancel?'danger':'text'} size="md" onClick={requestCancel}>{confirmCancel?'确认取消?':'取消订单'}</Button>
    </div>
  </main>;
}
