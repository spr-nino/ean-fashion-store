import {ArrowRight, Heart} from 'lucide-react';
import {useLocation} from 'react-router-dom';
import {LinkButton} from '../components/ui';

type OrderState = {id?: string};

export default function OrderSuccessPage(){
  const state=useLocation().state as OrderState|null;
  return <main className="success" aria-labelledby="success-title">
    <small>ORDER CONFIRMED</small>
    <h1 id="success-title">感谢你的选择。</h1>
    <p>模拟订单编号：{state?.id||'EAN-DEMO'}</p>
    <div className="successActions">
      <LinkButton to="/" variant="primary" trailingIcon={<ArrowRight size={15} aria-hidden="true"/>}>返回首页</LinkButton>
      <LinkButton to="/favorites" variant="secondary" leadingIcon={<Heart size={15} aria-hidden="true"/>}>查看收藏</LinkButton>
    </div>
  </main>;
}
