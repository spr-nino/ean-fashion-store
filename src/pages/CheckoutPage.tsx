import {useState} from 'react';
import type {ChangeEvent, FormEvent} from 'react';
import {ArrowRight, ShieldCheck} from 'lucide-react';
import {LinkButton, Button} from '../components/ui';
import {useNavigate} from 'react-router-dom';
import {useStore} from '../context/useStore';

type CheckoutField = 'name' | 'phone' | 'address';

export default function CheckoutPage(){
  const {cart,cartTotal,placeOrder}=useStore();
  const nav=useNavigate();
  const [name,setName]=useState('');
  const [phone,setPhone]=useState('');
  const [address,setAddress]=useState('');
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);
  const shipping=cartTotal>=999?0:39;

  const updateField=(field:CheckoutField)=>(event:ChangeEvent<HTMLInputElement|HTMLTextAreaElement>)=>{
    const value=event.target.value;
    if(field==='name')setName(value);
    if(field==='phone')setPhone(value);
    if(field==='address')setAddress(value);
    if(error)setError('');
  };

  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(loading)return;
    const trimmedName=name.trim();
    const trimmedPhone=phone.trim();
    const trimmedAddress=address.trim();
    if(!trimmedName||!/^1\d{10}$/.test(trimmedPhone)||!trimmedAddress){
      setError('请填写完整且正确的收货信息');
      return;
    }
    setError('');
    setLoading(true);
    window.setTimeout(()=>{
      const order=placeOrder();
      if(order)nav('/order-success',{state:order});
      else setLoading(false);
    },450);
  };

  if(!cart.length)return <main className="empty"><p>购物袋为空，请先选择商品。</p><LinkButton to="/shop" variant="secondary" trailingIcon={<ArrowRight size={15} aria-hidden="true"/>}>继续购物</LinkButton></main>;

  return <main className="checkout" aria-labelledby="checkout-title">
    <div className="checkoutHeading"><small>EAN CHECKOUT</small><h1 id="checkout-title">演示结算</h1></div>
    <p className="notice"><ShieldCheck size={16} aria-hidden="true"/>演示结算，不会产生真实支付。</p>
    <form onSubmit={submit} noValidate aria-describedby={error?'checkout-error':undefined}>
      <label htmlFor="checkout-name">收货人<input id="checkout-name" name="name" value={name} onChange={updateField('name')} autoComplete="name" required aria-invalid={Boolean(error)&&!name.trim()}/></label>
      <label htmlFor="checkout-phone">手机号<input id="checkout-phone" name="phone" value={phone} onChange={updateField('phone')} inputMode="tel" autoComplete="tel" placeholder="11位手机号" required aria-invalid={Boolean(error)&&!/^1\d{10}$/.test(phone.trim())}/></label>
      <label htmlFor="checkout-address">收货地址<textarea id="checkout-address" name="address" value={address} onChange={updateField('address')} autoComplete="street-address" required aria-invalid={Boolean(error)&&!address.trim()}/></label>
      <label htmlFor="checkout-shipping">配送方式<select id="checkout-shipping" name="shipping" defaultValue={shipping===0?'free':'standard'}><option value="standard">标准配送 ¥39</option><option value="free">满额免运</option></select></label>
      {error&&<p id="checkout-error" className="error" role="alert" aria-live="assertive">{error}</p>}
      <Button className="checkoutButton" type="submit" variant="primary" size="lg" loading={loading} loadingLabel="正在提交订单" trailingIcon={loading?undefined:<ArrowRight size={16} aria-hidden="true"/>}>确认模拟下单　¥ {(cartTotal+shipping).toLocaleString()}</Button>
    </form>
  </main>;
}
