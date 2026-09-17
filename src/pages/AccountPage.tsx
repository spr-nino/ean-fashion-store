import {useState} from 'react';
import type {FormEvent} from 'react';
import {ArrowRight, UserRound} from 'lucide-react';
import {LinkButton, Button} from '../components/ui';

export default function AccountPage(){
  const [email,setEmail]=useState('');
  const [password,setPassword]=useState('');
  const [mode,setMode]=useState<'login'|'register'>('login');
  const [message,setMessage]=useState('');
  const [loading,setLoading]=useState(false);
  const submit=(event:FormEvent<HTMLFormElement>)=>{
    event.preventDefault();
    if(loading)return;
    if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())||password.length<6){setMessage('请输入有效邮箱和至少 6 位密码');return;}
    setMessage('');
    setLoading(true);
    window.setTimeout(()=>{
      setMessage(mode==='login'?'演示登录成功。':'演示注册成功。');
      setLoading(false);
    },350);
  };
  return <main className="accountPage" aria-labelledby="account-title">
    <small>EAN ACCOUNT</small>
    <h1 id="account-title">{mode==='login'?'登录':'注册'}</h1>
    <p className="accountIntro">保存收藏、查看订单，并在下次结算时更快完成。</p>
    <form className="accountForm" onSubmit={submit} noValidate>
      <label htmlFor="account-email">邮箱<input id="account-email" name="email" type="email" value={email} onChange={event=>{setEmail(event.target.value);setMessage('')}} autoComplete="email" required/></label>
      <label htmlFor="account-password">密码<input id="account-password" name="password" type="password" value={password} onChange={event=>{setPassword(event.target.value);setMessage('')}} autoComplete={mode==='login'?'current-password':'new-password'} minLength={6} required/></label>
      {message&&<p className="accountMessage" role="status" aria-live="polite">{message}</p>}
      <Button type="submit" size="lg" loading={loading} loadingLabel={mode==='login'?'正在登录':'正在创建账户'} trailingIcon={loading?undefined:<ArrowRight size={16} aria-hidden="true"/>}>{mode==='login'?'登录':'创建账户'}</Button>
    </form>
    <div className="accountSwitch">
      <span>{mode==='login'?'还没有账户？':'已经有账户？'}</span>
      <Button type="button" variant="text" size="sm" disabled={loading} leadingIcon={<UserRound size={14} aria-hidden="true"/>} onClick={()=>{setMode(mode==='login'?'register':'login');setMessage('')}}>{mode==='login'?'注册':'返回登录'}</Button>
    </div>
    <LinkButton to="/" variant="text" size="sm">返回首页</LinkButton>
  </main>;
}
