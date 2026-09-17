import {createContext} from 'react';
import type {Product} from '../data/products';
export type CartItem={id:string;productId:string;size:string;color:string;qty:number;price:number};
export type Order={id:string;items:CartItem[];total:number;createdAt:string};
export type Ctx={cart:CartItem[];favorites:string[];orders:Order[];add:(p:Product,size:string,color:string,qty?:number)=>void;remove:(id:string)=>void;clear:()=>void;update:(id:string,qty:number)=>void;toggleFav:(id:string)=>void;isFav:(id:string)=>boolean;cartCount:number;cartTotal:number;placeOrder:()=>Order|null};
export const Store=createContext<Ctx|null>(null);
