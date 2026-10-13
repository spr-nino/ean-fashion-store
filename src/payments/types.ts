export type PaymentSession={orderId:string;amount:number};
export type PaymentResult={status:'paid'|'failed';transactionId?:string;message?:string};
export type PaymentCapabilities={simulation:boolean};

export interface PaymentProvider{
  name:string;
  capabilities:PaymentCapabilities;
  pay:(session:PaymentSession,opts?:{simulateFailure?:boolean})=>Promise<PaymentResult>;
}
