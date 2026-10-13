import {useEffect,useState} from 'react';
import type {ReactNode} from 'react';
import {useUser} from '@clerk/clerk-react';
import type {Product} from '../data/products';
import {Store,viewOrder} from './store';
import type {Address,AddressInput,CartItem,Order} from './store';
export {Store};

const read=<T,>(key:string,fallback:T):T=>{try{const x=JSON.parse(localStorage.getItem(key)||'null');return x?.version===1?x.data:fallback}catch{return fallback}};
const save=(k:string,d:unknown)=>localStorage.setItem(k,JSON.stringify({version:1,data:d}));

// 状态机功能之前的旧订单没有 status,迁移为已完成并补齐时间线(确认时间晚于推导的发货时间,保持时间线递增)。
const migrateOrder=(o:Order):Order=>o.status?o:{...o,status:'completed',paidAt:o.createdAt,confirmedAt:new Date(Date.parse(o.createdAt)+2*60_000).toISOString()};

let addrSeq=0;
const newAddressId=()=>`addr-${Date.now().toString(36)}-${(addrSeq++).toString(36)}`;

export function StoreProvider({children}:{children:ReactNode}){
  const {user}=useUser();
  const userId=user?.id??null;
  const [cart,setCart]=useState<CartItem[]>(()=>read('ean-cart',[]));
  const [favorites,setFavorites]=useState<string[]>(()=>read('ean-favorites',[]));
  const [orders,setOrders]=useState<Order[]>(()=>read<Order[]>('ean-orders',[]).map(migrateOrder));
  const [addresses,setAddresses]=useState<Address[]>([]);
  const [addrKey,setAddrKey]=useState<string|null>(null);
  const [loadedUserId,setLoadedUserId]=useState<string|null>(userId);

  if(loadedUserId!==userId){
    setLoadedUserId(userId);
    const key=userId?`ean-addresses-${userId}`:null;
    setAddrKey(key);
    setAddresses(key?read<Address[]>(key,[]):[]);
  }

  useEffect(()=>save('ean-cart',cart),[cart]);
  useEffect(()=>save('ean-favorites',favorites),[favorites]);
  useEffect(()=>save('ean-orders',orders),[orders]);
  useEffect(()=>{if(addrKey)save(addrKey,addresses)},[addrKey,addresses]);

  const add=(p:Product,size:string,color:string,qty=1)=>setCart(c=>{const id=`${p.id}-${size}-${color}`;const found=c.find(x=>x.id===id);return found?c.map(x=>x.id===id?{...x,qty:x.qty+qty}:x):[...c,{id,productId:p.id,size,color,qty,price:p.price}]});
  const remove=(id:string)=>setCart(c=>c.filter(x=>x.id!==id));
  const clear=()=>setCart([]);
  const update=(id:string,qty:number)=>setCart(c=>qty<1?c.filter(x=>x.id!==id):c.map(x=>x.id===id?{...x,qty}:x));
  const toggleFav=(id:string)=>setFavorites(f=>f.includes(id)?f.filter(x=>x!==id):[...f,id]);

  const placeOrder=(snapshot:{address:Address;shippingFee:number}):Order|null=>{
    if(!cart.length)return null;
    const subtotal=cart.reduce((s,x)=>s+x.price*x.qty,0);
    const order:Order={
      id:`EAN${Date.now().toString().slice(-8)}`,
      items:cart,
      subtotal,
      shippingFee:snapshot.shippingFee,
      total:subtotal+snapshot.shippingFee,
      address:snapshot.address,
      createdAt:new Date().toISOString(),
      status:'pending',
    };
    setOrders(x=>[order,...x]);
    setCart([]);
    return order;
  };

  const patchOrder=(id:string,patch:(o:Order)=>Order)=>setOrders(list=>list.map(o=>o.id===id?patch(o):o));
  const payOrder=(id:string)=>patchOrder(id,o=>o.status==='pending'?{...o,status:'paid',paidAt:new Date().toISOString()}:o);
  const confirmOrder=(id:string)=>patchOrder(id,o=>{
    const viewed=viewOrder(o);
    return viewed.status==='shipped'?{...viewed,status:'completed',confirmedAt:new Date().toISOString()}:o;
  });
  const cancelOrder=(id:string)=>patchOrder(id,o=>o.status==='pending'?{...o,status:'cancelled',cancelledAt:new Date().toISOString()}:o);

  const addAddress=(input:AddressInput):Address=>{
    const makeDefault=Boolean(input.isDefault)||addresses.length===0;
    const address:Address={id:newAddressId(),name:input.name,phone:input.phone,country:input.country,province:input.province,city:input.city,postcode:input.postcode,detail:input.detail,isDefault:makeDefault};
    setAddresses(list=>[...(makeDefault?list.map(a=>({...a,isDefault:false})):list),address]);
    return address;
  };

  const updateAddress=(id:string,patch:Partial<AddressInput>)=>setAddresses(list=>{
    const next=list.map(a=>a.id===id?{...a,...patch,id}:a);
    return patch.isDefault?next.map(a=>({...a,isDefault:a.id===id})):next;
  });

  const removeAddress=(id:string)=>setAddresses(list=>{
    const removed=list.find(a=>a.id===id);
    const next=list.filter(a=>a.id!==id);
    if(removed?.isDefault&&next.length&&!next.some(a=>a.isDefault))next[0]={...next[0],isDefault:true};
    return next;
  });

  const setDefaultAddress=(id:string)=>setAddresses(list=>list.map(a=>({...a,isDefault:a.id===id})));

  const value={
    cart,favorites,orders:orders.map(viewOrder),addresses,
    add,remove,clear,update,toggleFav,
    isFav:(id:string)=>favorites.includes(id),
    cartCount:cart.reduce((s,x)=>s+x.qty,0),
    cartTotal:cart.reduce((s,x)=>s+x.price*x.qty,0),
    placeOrder,payOrder,confirmOrder,cancelOrder,
    addAddress,updateAddress,removeAddress,setDefaultAddress,
  };
  return <Store.Provider value={value}>{children}</Store.Provider>;
}
