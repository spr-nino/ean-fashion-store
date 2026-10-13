import {useState} from 'react';
import {RedirectToSignIn,SignedIn,SignedOut,useClerk,useUser} from '@clerk/clerk-react';
import {Link,useNavigate} from 'react-router-dom';
import {LogOut,MapPin,Plus,Settings} from 'lucide-react';
import {Button,LinkButton} from '../components/ui';
import {AddressForm} from '../components/AddressForm';
import {emptyAddressValues,validateAddress,valuesFromAddress} from '../data/address';
import type {AddressFormValues} from '../data/address';
import {getCountryName} from '../data/shipping';
import {useStore} from '../context/useStore';
import {ORDER_STATUS_LABELS} from '../context/store';
import type {Address} from '../context/store';

type EditorState = {mode: 'closed'} | {mode: 'add'} | {mode: 'edit'; id: string};

function AddressSection(){
  const {addresses,addAddress,updateAddress,removeAddress,setDefaultAddress}=useStore();
  const [editor,setEditor]=useState<EditorState>({mode:'closed'});
  const [values,setValues]=useState<AddressFormValues>(emptyAddressValues());
  const [makeDefault,setMakeDefault]=useState(false);
  const [error,setError]=useState('');
  const [confirmDeleteId,setConfirmDeleteId]=useState<string|null>(null);

  const openAdd=()=>{setValues(emptyAddressValues());setMakeDefault(false);setError('');setEditor({mode:'add'})};
  const openEdit=(address:Address)=>{setValues(valuesFromAddress(address));setMakeDefault(address.isDefault);setError('');setEditor({mode:'edit',id:address.id})};
  const closeEditor=()=>{setEditor({mode:'closed'});setError('')};
  const change=(field:keyof AddressFormValues,value:string)=>{setValues(v=>({...v,[field]:value}));if(error)setError('')};

  const submit=()=>{
    const message=validateAddress(values);
    if(message){setError(message);return}
    if(editor.mode==='add')addAddress({...values,isDefault:makeDefault});
    else if(editor.mode==='edit')updateAddress(editor.id,{...values,isDefault:makeDefault});
    closeEditor();
  };

  const requestDelete=(id:string)=>{
    if(confirmDeleteId===id){removeAddress(id);setConfirmDeleteId(null);return}
    setConfirmDeleteId(id);
    window.setTimeout(()=>setConfirmDeleteId(current=>current===id?null:current),2600);
  };

  if(editor.mode!=='closed'){
    return <section className="accountAddresses" aria-labelledby="addresses-title">
      <h2 id="addresses-title">{editor.mode==='add'?'添加新地址':'编辑地址'}</h2>
      <AddressForm values={values} onChange={change} idPrefix="account-address"/>
      <label className="addressDefaultCheck">
        <input type="checkbox" checked={makeDefault} onChange={event=>setMakeDefault(event.target.checked)}/>
        设为默认地址
      </label>
      {error&&<p className="error" role="alert">{error}</p>}
      <div className="addressEditorActions">
        <Button variant="primary" size="md" onClick={submit}>保存地址</Button>
        <Button variant="text" size="md" onClick={closeEditor}>取消</Button>
      </div>
    </section>;
  }

  return <section className="accountAddresses" aria-labelledby="addresses-title">
    <h2 id="addresses-title">地址管理</h2>
    <div className="addressGrid">
      {addresses.map(address=><article key={address.id} className="addressCard">
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
        <div className="addressCardActions">
          <Button variant="text" size="sm" onClick={()=>openEdit(address)}>编辑</Button>
          {!address.isDefault&&<Button variant="text" size="sm" onClick={()=>setDefaultAddress(address.id)}>设为默认</Button>}
          <Button variant={confirmDeleteId===address.id?'danger':'text'} size="sm" onClick={()=>requestDelete(address.id)}>
            {confirmDeleteId===address.id?'确认删除?':'删除'}
          </Button>
        </div>
      </article>)}
      <button type="button" className="addressCardAdd" onClick={openAdd}>
        <Plus size={20} aria-hidden="true"/>
        <span>添加新地址</span>
      </button>
    </div>
    {addresses.length===0&&<p className="accountIntro addressEmptyHint"><MapPin size={14} aria-hidden="true"/> 还没有保存地址，添加一个方便下次结算。</p>}
  </section>;
}

function AccountPanel(){
  const {user}=useUser();
  const {orders}=useStore();
  const {openUserProfile,signOut}=useClerk();
  const nav=useNavigate();
  const email=user?.primaryEmailAddress?.emailAddress??'';
  const name=user?.fullName??email.split('@')[0]??'';
  return <main className="accountPage" aria-labelledby="account-title">
    <small>EAN ACCOUNT</small>
    <h1 id="account-title">你好,{name||'朋友'}</h1>
    <p className="accountIntro">{email}</p>
    <AddressSection/>
    <section className="accountOrders" aria-labelledby="orders-title">
      <h2 id="orders-title">历史订单</h2>
      {orders.length?<ul className="orderList">{orders.map(o=><li key={o.id}>
        <Link className="orderRow" to={`/orders/${o.id}`} aria-label={`查看订单 ${o.id} 详情`}>
          <span className="orderRow__id">{o.id}</span>
          <span className={`statusBadge statusBadge--${o.status}`}>{ORDER_STATUS_LABELS[o.status]}</span>
          <span className="orderRow__total">¥ {o.total.toLocaleString()}</span>
          <time dateTime={o.createdAt}>{new Date(o.createdAt).toLocaleDateString('zh-CN')}</time>
        </Link>
      </li>)}</ul>:<p className="accountIntro">还没有订单,去挑一件喜欢的吧。</p>}
    </section>
    <div className="accountActions">
      <Button variant="secondary" size="sm" leadingIcon={<Settings size={14} aria-hidden="true"/>} onClick={()=>openUserProfile()}>管理账户</Button>
      <Button variant="text" size="sm" leadingIcon={<LogOut size={14} aria-hidden="true"/>} onClick={()=>{nav('/');void signOut()}}>退出登录</Button>
    </div>
    <LinkButton to="/" variant="text" size="sm">返回首页</LinkButton>
  </main>;
}

export default function AccountPage(){
  return <>
    <SignedOut><RedirectToSignIn/></SignedOut>
    <SignedIn><AccountPanel/></SignedIn>
  </>;
}
