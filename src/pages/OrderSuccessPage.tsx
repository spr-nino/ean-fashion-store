import {ArrowRight, Heart, MapPin} from 'lucide-react';
import {useLocation} from 'react-router-dom';
import {LinkButton} from '../components/ui';
import {getCountryName} from '../data/shipping';
import type {Order} from '../context/store';

export default function OrderSuccessPage(){
  const order=useLocation().state as Order|null;
  return <main className="success" aria-labelledby="success-title">
    <small>ORDER CONFIRMED</small>
    <h1 id="success-title">感谢你的选择。</h1>
    <p>模拟订单编号：{order?.id||'EAN-DEMO'}</p>
    {order?.address&&<section className="successAddress" aria-label="收货信息">
      <p><MapPin size={14} aria-hidden="true"/> {order.address.name}　{order.address.phone}</p>
      <p>{order.address.detail}，{order.address.city}，{order.address.province} {order.address.postcode}，{getCountryName(order.address.country)}</p>
    </section>}
    {typeof order?.total==='number'&&<div className="successTotals">
      {typeof order.subtotal==='number'&&<span>商品 ¥ {order.subtotal.toLocaleString()}</span>}
      {typeof order.shippingFee==='number'&&<span>运费 {order.shippingFee===0?'免费':`¥ ${order.shippingFee.toLocaleString()}`}</span>}
      <strong>合计 ¥ {order.total.toLocaleString()}</strong>
    </div>}
    <div className="successActions">
      {order?.id&&<LinkButton to={`/orders/${order.id}`} variant="primary" trailingIcon={<ArrowRight size={15} aria-hidden="true"/>}>查看订单进度</LinkButton>}
      <LinkButton to="/" variant={order?.id?'secondary':'primary'} trailingIcon={order?.id?undefined:<ArrowRight size={15} aria-hidden="true"/>}>返回首页</LinkButton>
      <LinkButton to="/favorites" variant="secondary" leadingIcon={<Heart size={15} aria-hidden="true"/>}>查看收藏</LinkButton>
    </div>
  </main>;
}
