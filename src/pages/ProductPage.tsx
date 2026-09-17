import {useState} from 'react';
import {ArrowRight, Heart, Minus, Plus, ShoppingBag} from 'lucide-react';
import {useParams} from 'react-router-dom';
import {getProduct} from '../data/products';
import {useStore} from '../context/useStore';
import {Button, IconButton, LinkButton, Toast} from '../components/ui';

export default function ProductPage(){
  const {slug}=useParams();
  const product=getProduct(slug||'');
  const {add,toggleFav,isFav}=useStore();
  const [imageIndex,setImageIndex]=useState(0);
  const [size,setSize]=useState('');
  const [color,setColor]=useState(product?.color||'');
  const [qty,setQty]=useState(1);
  const [notice,setNotice]=useState('');
  const [loading,setLoading]=useState(false);

  if(!product)return <div className="empty">商品不存在</div>;

  const submit=()=>{
    if(!size){setNotice('请先选择尺码');return}
    setLoading(true);
    window.setTimeout(()=>{
      add(product,size,color,qty);
      setLoading(false);
      setNotice('已加入购物袋');
      window.setTimeout(()=>setNotice(''),2200);
    },380);
  };

  return <main className="productPage">
    <div className="gallery">
      <img src={product.images[imageIndex]} alt={product.name}/>
      <div className="galleryThumbs" role="group" aria-label={`${product.name}图片`}>
        {product.images.map((image,index)=><IconButton
          key={image}
          className={imageIndex===index?'sel':''}
          variant="ghost"
          size="sm"
          aria-label={`查看第${index+1}张${product.name}图片`}
          aria-current={imageIndex===index?'true':undefined}
          icon={<img src={image} alt="" aria-hidden="true"/>}
          onClick={()=>setImageIndex(index)}
        />)}
      </div>
    </div>
    <section className="productInfo">
      <small>{product.cat} / {product.en}</small>
      <h1>{product.name}</h1>
      <strong>¥ {product.price.toLocaleString()}</strong>
      <p>{product.description}</p>
      <fieldset>
        <legend>颜色　{color}</legend>
        <Button type="button" className="swatch" variant={color===product.color?'primary':'secondary'} size="sm" onClick={()=>setColor(product.color)} aria-pressed={color===product.color}>{product.color}</Button>
      </fieldset>
      <fieldset>
        <legend>尺码</legend>
        <div className="sizes" role="group" aria-label={`选择${product.name}尺码`}>
          {product.sizes.map(sizeOption=><Button key={sizeOption} type="button" className={size===sizeOption?'selected':''} variant={size===sizeOption?'primary':'secondary'} size="sm" onClick={()=>setSize(sizeOption)} aria-pressed={size===sizeOption}>{sizeOption}</Button>)}
        </div>
      </fieldset>
      <LinkButton className="sizeGuide" variant="text" size="sm" to="/size-guide" trailingIcon={<ArrowRight size={13} aria-hidden="true"/>}>尺码指南</LinkButton>
      <div className="qty" role="group" aria-label={`${product.name}数量`}>
        <IconButton size="sm" variant="ghost" aria-label="减少数量" disabled={qty<=1} icon={<Minus size={16}/>} onClick={()=>setQty(Math.max(1,qty-1))}/>
        <span aria-live="polite" aria-atomic="true">{qty}</span>
        <IconButton size="sm" variant="ghost" aria-label="增加数量" icon={<Plus size={16}/>} onClick={()=>setQty(qty+1)}/>
      </div>
      <Button className="productAdd" variant="primary" size="lg" loading={loading} loadingLabel="正在加入" onClick={submit} trailingIcon={loading?undefined:<ShoppingBag size={17}/>}>加入购物袋</Button>
      <Button variant="secondary" className="favoriteAction" aria-pressed={isFav(product.id)} onClick={()=>toggleFav(product.id)} leadingIcon={<Heart size={17} fill={isFav(product.id)?'currentColor':'none'}/>}>{isFav(product.id)?'已收藏':'收藏商品'}</Button>
      {notice&&<Toast message={notice}/>} 
      <details open><summary>面料与洗护</summary><p>{product.fabric}。{product.care}。</p></details>
      <details><summary>配送与退换</summary><p>满 ¥999 免运，签收后 7 天内支持退换。</p></details>
      <details><summary>模特信息</summary><p>{product.model}</p></details>
    </section>
  </main>;
}
