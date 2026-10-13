import type{PaymentProvider,PaymentResult,PaymentSession}from'./types';

const wait=(ms:number)=>new Promise<void>(resolve=>{window.setTimeout(resolve,ms)});

export class MockProvider implements PaymentProvider{
  name='模拟支付';
  capabilities={simulation:true};
  async pay(_session:PaymentSession,opts?:{simulateFailure?:boolean}):Promise<PaymentResult>{
    await wait(800);
    if(opts?.simulateFailure)return{status:'failed',message:'模拟支付失败，请重试'};
    return{status:'paid',transactionId:`MOCK${Date.now().toString().slice(-10)}`};
  }
}
