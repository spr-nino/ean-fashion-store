import {ArrowRight} from 'lucide-react';
import {useNavigate} from 'react-router-dom';
import {products} from '../data/products';
import ProductCard from '../components/ProductCard';
import {LinkButton} from '../components/ui';

export default function HomePage(){
  const nav=useNavigate();
  return <>
    <section className="hero"><div className="heroVisual"></div><div className="heroCopy"><small>EAN / NEW SEASON 2024</small><h1>留白之下，自有轮廓。</h1><p>为不愿被风格定义的人而作。</p><LinkButton to="/shop" size="lg" trailingIcon={<ArrowRight size={16}/>}>探索新季系列</LinkButton></div></section>
    <div className="bar">免运配送　│　7天退换　│　中性尺码指南</div>
    <section className="section"><div className="sectionHead"><div><small>COLLECTION 01</small><h2>新着 / New Forms</h2></div><LinkButton to="/shop" variant="text" size="sm" trailingIcon={<ArrowRight size={14} aria-hidden="true"/>}>查看全部</LinkButton></div><div className="grid">{products.slice(0,4).map(p=><ProductCard key={p.id} p={p} onOpen={x=>nav(`/product/${x.slug}`)}/>)}</div></section>
    <section className="story"><div className="storyImg"></div><article><small>ABOUT EAN</small><h2>衣服不替你定义身份。</h2><p>我们相信，风格不是标签，而是一种持续生长的生活方式。EAN 以中性的设计语言，探索衣着与自我之间更自由的关系。</p><LinkButton to="/journal" variant="secondary" trailingIcon={<ArrowRight size={16}/>}>进入造型志</LinkButton></article></section>
  </>
}
