import {ArrowRight} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {products} from '../data/products';
import ProductCard from '../components/ProductCard';
import {LinkButton} from '../components/ui';
import {useStore} from '../context/useStore';

export default function FavoritesPage(){
  const {favorites}=useStore();
  const nav=useNavigate();
  const list=products.filter(p=>favorites.includes(p.id));
  return <main className="section" aria-labelledby="favorites-title">
    <small>EAN EDIT</small>
    <h1 id="favorites-title">收藏 / Favorites</h1>
    {list.length?<div className="grid">{list.map(p=><ProductCard key={p.id} p={p} onOpen={x=>nav(`/product/${x.slug}`)}/>)}</div>:<div className="empty"><p>还没有收藏商品。</p><LinkButton to="/shop" variant="secondary" trailingIcon={<ArrowRight size={15} aria-hidden="true"/>}>去逛逛</LinkButton></div>}
  </main>;
}
