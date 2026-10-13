import {createContext} from 'react';
import type {Product} from '../data/products';
export type CartItem={id:string;productId:string;size:string;color:string;qty:number;price:number};
export type Address={id:string;name:string;phone:string;country:string;province:string;city:string;postcode:string;detail:string;isDefault:boolean};
export type AddressInput=Omit<Address,'id'|'isDefault'>&{isDefault?:boolean};
export type OrderStatus='pending'|'paid'|'shipped'|'completed'|'cancelled';
export type Order={id:string;items:CartItem[];total:number;createdAt:string;subtotal?:number;shippingFee?:number;address?:Address;status:OrderStatus;paidAt?:string;shippedAt?:string;confirmedAt?:string;cancelledAt?:string};
export const AUTO_SHIP_MS=60_000;
export const PAYMENT_WINDOW_MS=30*60_000;
export const ORDER_STATUS_LABELS:Record<OrderStatus,string>={pending:'待付款',paid:'待发货',shipped:'已发货',completed:'已完成',cancelled:'已取消'};
export const paymentRemainingMs=(o:Order,now:number=Date.now()):number=>Math.max(0,PAYMENT_WINDOW_MS-(now-Date.parse(o.createdAt)));
// 演示环境没有真实仓库:付款满 AUTO_SHIP_MS 的订单在读出时惰性推导为已发货;
// 没有支付网关回调:超过 PAYMENT_WINDOW_MS 未付款的订单在读出时惰性推导为已取消。
export const viewOrder=(o:Order):Order=>{
  if(o.status==='pending'&&Date.now()-Date.parse(o.createdAt)>PAYMENT_WINDOW_MS){
    return {...o,status:'cancelled',cancelledAt:new Date(Date.parse(o.createdAt)+PAYMENT_WINDOW_MS).toISOString()};
  }
  if(o.status==='paid'&&o.paidAt){
    const shippedAt=new Date(Date.parse(o.paidAt)+AUTO_SHIP_MS).toISOString();
    if(Date.now()>=Date.parse(shippedAt))return {...o,status:'shipped',shippedAt};
  }
  if(o.status==='completed'&&o.paidAt&&!o.shippedAt){
    return {...o,shippedAt:new Date(Date.parse(o.paidAt)+AUTO_SHIP_MS).toISOString()};
  }
  return o;
};
export type Ctx={
  cart:CartItem[];favorites:string[];orders:Order[];addresses:Address[];
  add:(p:Product,size:string,color:string,qty?:number)=>void;
  remove:(id:string)=>void;clear:()=>void;update:(id:string,qty:number)=>void;
  toggleFav:(id:string)=>void;isFav:(id:string)=>boolean;
  cartCount:number;cartTotal:number;
  placeOrder:(snapshot:{address:Address;shippingFee:number})=>Order|null;
  payOrder:(id:string)=>void;
  confirmOrder:(id:string)=>void;
  cancelOrder:(id:string)=>void;
  addAddress:(input:AddressInput)=>Address;
  updateAddress:(id:string,patch:Partial<AddressInput>)=>void;
  removeAddress:(id:string)=>void;
  setDefaultAddress:(id:string)=>void;
};
export const Store=createContext<Ctx|null>(null);
