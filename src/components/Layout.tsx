import {useState} from 'react';
import type {ReactNode} from 'react';
import {Link} from 'react-router-dom';
import {ArrowRight, Heart, Menu, Search, ShoppingBag, User, X} from 'lucide-react';
import {useStore} from '../context/useStore';
import {IconButton} from './ui';

export function Layout({children}:{children:ReactNode}){
  const {cartCount}=useStore();
  const [open,setOpen]=useState(false);
  const closeMenu=()=>setOpen(false);
  return <>
    <header>
      <IconButton className="mobile-menu" variant="ghost" size="md" aria-label={open?'关闭导航菜单':'打开导航菜单'} aria-expanded={open} aria-controls="primary-nav" icon={open?<X/>:<Menu/>} onClick={()=>setOpen(value=>!value)}/>
      <nav id="primary-nav" className={open?'open':''}>
        <Link to="/" onClick={closeMenu}>新品</Link><Link to="/shop" onClick={closeMenu}>商店</Link><Link to="/journal" onClick={closeMenu}>造型志</Link>
      </nav>
      <Link className="logo" to="/" aria-label="EAN 首页">EAN</Link>
      <aside>
        <Link className="header-action" to="/shop" aria-label="搜索商品" title="搜索"><Search aria-hidden="true"/></Link>
        <Link className="header-action" to="/account" aria-label="账户" title="账户"><User aria-hidden="true"/></Link>
        <Link className="header-action" to="/favorites" aria-label="收藏" title="收藏"><Heart aria-hidden="true"/></Link>
        <Link className="header-cart" to="/cart" aria-label={`购物袋，${cartCount}件商品`}><ShoppingBag aria-hidden="true"/><span>购物袋</span><b className="cart-badge" aria-hidden="true">{cartCount}</b></Link>
      </aside>
    </header>
    {children}
    <footer><b>EAN</b><p>为不愿被风格定义的人而作</p><div><Link to="/shop">商店</Link>　<Link to="/journal">造型志</Link>　<Link to="/favorites">收藏</Link></div><small>订阅 EAN 最新资讯　输入邮箱 <ArrowRight size={13} aria-hidden="true"/></small></footer>
  </>
}
