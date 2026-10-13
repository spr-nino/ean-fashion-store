import {useEffect, useRef, useState} from 'react';
import type {MouseEvent} from 'react';
import {Heart, Check, ShoppingBag} from 'lucide-react';
import {Link,useLocation,useNavigate} from 'react-router-dom';
import {useAuth} from '@clerk/clerk-react';
import type {Product} from '../data/products';
import {useStore} from '../context/useStore';
import {Button, IconButton, Toast} from './ui';

interface ProductCardProps {p: Product; onOpen?: (product: Product) => void}

export default function ProductCard({p,onOpen}: ProductCardProps){
  const {toggleFav,isFav,add}=useStore();
  const {isSignedIn}=useAuth();
  const nav=useNavigate();
  const loc=useLocation();
  const [quick,setQuick]=useState(false);
  const [size,setSize]=useState('');
  const [added,setAdded]=useState(false);
  const feedbackTimer=useRef<number | undefined>(undefined);
  const productHref=`/product/${p.slug}`;
  // A parent may provide a custom route handler.  Prevent the Link's own
  // navigation in that case so one click does not push the same route twice.
  const open=(event:MouseEvent<HTMLAnchorElement>)=>{
    // Preserve normal Link behavior for modified clicks (open in a new tab,
    // context-menu navigation, etc.).
    if(!onOpen||event.defaultPrevented||event.button!==0||event.metaKey||event.ctrlKey||event.shiftKey||event.altKey)return;
    event.preventDefault();
    onOpen(p);
  };
  useEffect(()=>()=>{if(feedbackTimer.current!==undefined)window.clearTimeout(feedbackTimer.current)},[]);
  const handleAdd=()=>{if(!size||added)return;add(p,size,p.color);setAdded(true);setQuick(true);if(feedbackTimer.current!==undefined)window.clearTimeout(feedbackTimer.current);feedbackTimer.current=window.setTimeout(()=>{setAdded(false);setQuick(false);setSize('')},1800)};
  return <article className="card">
    <div className="cardPic">
      <Link to={productHref} onClick={open} className="cardMedia" aria-label={`查看${p.name}`}>
        <img src={p.images[0]} alt={p.name}/><img className="hoverImg" src={p.images[1]} alt="" aria-hidden="true"/>
      </Link>
      <IconButton className="fav" variant="ghost" size="sm" aria-label={isFav(p.id)?`取消收藏${p.name}`:`收藏${p.name}`} aria-pressed={isFav(p.id)} icon={<Heart fill={isFav(p.id)?'currentColor':'none'}/>} onClick={()=>{if(!isSignedIn){nav(`/sign-in?redirect_url=${encodeURIComponent(loc.pathname)}`);return}toggleFav(p.id)}}/>
      {p.isNew&&<em>NEW</em>}
      <div className={`quick-panel ${quick?'is-open':''}`} id={`quick-panel-${p.id}`} role="group" aria-label={`快速购买${p.name}`}>
        <Button className="quick-panel__trigger" variant="ghost" size="sm" leadingIcon={added ? <Check size={15}/> : <ShoppingBag size={16}/>} onClick={()=>setQuick(!quick)} disabled={added} aria-expanded={quick && !added} aria-controls={`quick-options-${p.id}`}>{added ? '已加入购物袋 ✓' : quick ? '收起尺码' : '选择尺码'}</Button>
        <div id={`quick-options-${p.id}`} className="quick-panel__options" aria-hidden={!quick || added} hidden={!quick || added}>
          <div className="quick-size-options" role="group" aria-label={`选择${p.name}尺码`}>
            {p.sizes.map(s=><Button type="button" key={s} size="sm" variant={size===s?'primary':'secondary'} aria-pressed={size===s} disabled={!quick || added} onClick={()=>setSize(s)}>{s}</Button>)}
          </div>
          <Button variant="primary" size="sm" disabled={!size || !quick || added} onClick={handleAdd} trailingIcon={<Check size={15}/>}>加入购物袋</Button>
        </div>
      </div>
    </div>
    <Link to={productHref} onClick={open} className="cardName">{p.name}</Link>
    <small>{p.cat} / {p.color}</small><strong>¥ {p.price.toLocaleString()}</strong>
    <span className={`cardFeedback ${added?'is-visible':''}`} aria-hidden="true">{added?'已加入购物袋 ✓':''}</span>
    {added&&<Toast message={`${p.name}已加入购物袋`}/>} 
  </article>
}
