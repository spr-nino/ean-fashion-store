import type{PaymentProvider}from'./types';
import{MockProvider}from'./mock';

// 支付服务商替换点：有资质后新增真实 provider（如 AlipayProvider）并替换此行，页面与业务代码不变。
export const paymentProvider:PaymentProvider=new MockProvider();

export type{PaymentProvider,PaymentResult,PaymentSession}from'./types';
