import {useState} from 'react';
import type {FormEvent} from 'react';
import {useUser} from '@clerk/clerk-react';
import {ArrowRight,ShieldCheck,Truck} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {LinkButton,Button} from '../components/ui';
import {AddressForm} from '../components/AddressForm';
import {emptyAddressValues,validateAddress} from '../data/address';
import type {AddressFormValues} from '../data/address';
import {getCountryName,resolveFreight} from '../data/shipping';
import {useStore} from '../context/useStore';
import type {Address} from '../context/store';

export default function CheckoutPage(){
  const {cart,cartTotal,addresses,addAddress,placeOrder}=useStore();
  const {isSignedIn,isLoaded}=useUser();
  const nav=useNavigate();
  const [selection,setSelection]=useState<string|null>(null);
  const [newValues,setNewValues]=useState<AddressFormValues>(emptyAddressValues());
  const [saveToBook,setSaveToBook]=useState(true);
  const [error,setError]=useState('');
  const [loading,setLoading]=useState(false);

  const effectiveSelection=selection
    ??(addresses.find(a=>a.isDefault)?.id??addresses[0]?.id??'new');
  const usingBook=Boolean(isSignedIn)&&effectiveSelection!=='new';
  const selectedAddress=usingBook?addresses.find(a=>a.id===effectiveSelection):undefined;
  const currentCountry=(usingBook?selectedAddress?.country:newValues.country)||'CN';
  const quote=resolveFreight(currentCountry,cartTotal);
  const grandTotal=cartTotal+quote.fee;

  const changeNew=(field:keyof AddressFormValues,value:string)=>{
    setNewValues(v=>({...v,[field]:value}));
    if(error)setError('');
  };

  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(loading)return;
    let address:Address;
    if(usingBook){
      if(!selectedAddress){setError('请选择收货地址');return}
      address=selectedAddress;
    }else{
      const message=validateAddress(newValues);
      if(message){setError(message);return}
      address={id:'oneoff',...newValues,isDefault:false};
    }
    setError('');
    setLoading(true);
    window.setTimeout(()=>{
      let snapshot=address;
      if(!usingBook&&isSignedIn&&saveToBook){
        snapshot=addAddress({...newValues});
      }
      const order=placeOrder({address:snapshot,shippingFee:quote.fee});
      if(order)nav(`/payment/${order.id}`);
      else setLoading(false);
    },450);
  };

  if(!cart.length)return <main className="empty"><p>购物袋为空，请先选择商品。</p><LinkButton to="/shop" variant="secondary" trailingIcon={<ArrowRight size={15} aria-hidden="true"/>}>继续购物</LinkButton></main>;

  return <main className="checkout" aria-labelledby="checkout-title">
    <div className="checkoutHeading"><small>EAN CHECKOUT</small><h1 id="checkout-title">演示结算</h1></div>
    <p className="notice"><ShieldCheck size={16} aria-hidden="true"/>演示结算，不会产生真实支付。</p>
    <div className="checkoutLayout">
      <form id="checkout-form" className="checkoutMain" onSubmit={submit} noValidate aria-describedby={error?'checkout-error':undefined}>
        <h2>收货地址</h2>
        {!isLoaded&&<p className="accountIntro">正在读取账户信息…</p>}
        {isLoaded&&isSignedIn&&<div className="addressPick" role="radiogroup" aria-label="选择收货地址">
          {addresses.map(address=><button
            key={address.id}
            type="button"
            role="radio"
            aria-checked={effectiveSelection===address.id}
            className={`addressCard addressPickCard${effectiveSelection===address.id?' selected':''}`}
            onClick={()=>{setSelection(address.id);if(error)setError('')}}
          >
            <header>
              <strong>{address.name}</strong>
              {address.isDefault&&<span className="addressBadge">默认</span>}
            </header>
            <p className="addressPhone">{address.phone}</p>
            <p className="addressLines">
              {address.detail}<br/>
              {address.city}，{address.province} {address.postcode}<br/>
              {getCountryName(address.country)}
            </p>
          </button>)}
          <button
            type="button"
            role="radio"
            aria-checked={effectiveSelection==='new'}
            className={`addressCard addressPickCard addressPickNew${effectiveSelection==='new'?' selected':''}`}
            onClick={()=>setSelection('new')}
          >使用新地址</button>
        </div>}
        {(!isSignedIn||effectiveSelection==='new')&&isLoaded&&<>
          <AddressForm values={newValues} onChange={changeNew} idPrefix="checkout-address"/>
          {isSignedIn
            ?<label className="addressDefaultCheck"><input type="checkbox" checked={saveToBook} onChange={event=>setSaveToBook(event.target.checked)}/>保存到地址簿</label>
            :<p className="guestHint">以游客身份结算，地址仅用于本单。<LinkButton to="/sign-in" variant="text" size="sm">登录后可保存地址</LinkButton></p>}
        </>}
        {error&&<p id="checkout-error" className="error" role="alert" aria-live="assertive">{error}</p>}
      </form>
      <aside className="orderSummary" aria-label="订单明细">
        <h2>订单明细</h2>
        <div className="summaryRow"><span>商品小计</span><span>¥ {cartTotal.toLocaleString()}</span></div>
        <div className="summaryRow">
          <span>配送（{quote.zoneName}）</span>
          <span>{quote.isFree?<>免费 <s className="strike">¥ {resolveFreight(currentCountry,0).fee.toLocaleString()}</s></>:<>¥ {quote.fee.toLocaleString()}</>}</span>
        </div>
        {quote.remaining>0&&<p className="freightHint"><Truck size={14} aria-hidden="true"/>再买 ¥ {quote.remaining.toLocaleString()} 即可免运费</p>}
        <div className="summaryRow summaryTotal"><span>合计</span><strong>¥ {grandTotal.toLocaleString()}</strong></div>
        <Button className="checkoutButton" type="submit" form="checkout-form" variant="primary" size="lg" loading={loading} loadingLabel="正在提交订单" trailingIcon={loading?undefined:<ArrowRight size={16} aria-hidden="true"/>}>确认模拟下单</Button>
      </aside>
    </div>
  </main>;
}
