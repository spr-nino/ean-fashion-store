import {useMemo, useState} from 'react';
import {ArrowRight, Search, SlidersHorizontal, X} from 'lucide-react';
import {useNavigate, useSearchParams} from 'react-router-dom';
import {products} from '../data/products';
import ProductCard from '../components/ProductCard';
import {Button, IconButton, Select} from '../components/ui';
import type {SelectOption} from '../components/ui';

const sortOptions: readonly SelectOption[] = [
  {value: '推荐', label: '推荐'},
  {value: '价格从低到高', label: '价格从低到高'},
  {value: '价格从高到低', label: '价格从高到低'},
];

const colorOptions: readonly SelectOption[] = [
  {value: '全部', label: '全部颜色'},
  {value: '炭黑', label: '炭黑'},
  {value: '雾白', label: '雾白'},
  {value: '石灰', label: '石灰'},
  {value: '灰褐', label: '灰褐'},
  {value: '燕麦', label: '燕麦'},
];

const categories = ['全部', '外套', '上装', '裤装', '针织', '配饰'] as const;

export default function ShopPage() {
  const nav = useNavigate();
  const [query] = useSearchParams();
  const [term, setTerm] = useState(query.get('q') || '');
  const [cat, setCat] = useState(query.get('cat') || '全部');
  const [color, setColor] = useState('全部');
  const [sort, setSort] = useState('推荐');
  const [filtersOpen, setFiltersOpen] = useState(false);

  const list = useMemo(
    () => products
      .filter((product) => (
        (cat === '全部' || product.cat === cat)
        && (color === '全部' || product.color === color)
        && `${product.name}${product.en}${product.tags.join('')}`.toLowerCase().includes(term.toLowerCase())
      ))
      .sort((a, b) => (
        sort === '价格从低到高'
          ? a.price - b.price
          : sort === '价格从高到低'
            ? b.price - a.price
            : 0
      )),
    [cat, color, sort, term],
  );

  const clear = () => {
    setTerm('');
    setCat('全部');
    setColor('全部');
    setSort('推荐');
  };

  return (
    <main className="shopPage">
      <div className="shopTop">
        <div>
          <small>ALL FORMS</small>
          <h1>商店 / Shop</h1>
        </div>
        <div className="shopSearch">
          <label className="sr-only" htmlFor="shop-search">搜索商品</label>
          <Search size={16} aria-hidden="true" />
          <input
            id="shop-search"
            value={term}
            onChange={(event) => setTerm(event.target.value)}
            placeholder="搜索商品、分类或标签"
          />
        </div>
        <Select
          className="shopSortSelect"
          aria-label="商品排序"
          options={sortOptions}
          value={sort}
          onChange={setSort}
        />
      </div>

      <Button
        className="filterToggle"
        variant="secondary"
        size="sm"
        leadingIcon={<SlidersHorizontal size={15} aria-hidden="true" />}
        onClick={() => setFiltersOpen(true)}
        aria-expanded={filtersOpen}
        aria-controls="shop-filters"
      >
        筛选
      </Button>

      <div id="shop-filters" className={`shopFilters ${filtersOpen ? 'is-open' : ''}`} aria-label="商品筛选">
        <div className="mobileFilterHead">
          <strong>筛选商品</strong>
          <IconButton size="sm" aria-label="关闭筛选" icon={<X aria-hidden="true" />} onClick={() => setFiltersOpen(false)} />
        </div>
        {categories.map((category) => (
          <Button
            key={category}
            variant="text"
            size="sm"
            className={cat === category ? 'active filter-button' : 'filter-button'}
            onClick={() => setCat(category)}
            aria-pressed={cat === category}
          >
            {category}
          </Button>
        ))}
        <div className="filterSelect">
          <span className="filterSelect__label" aria-hidden="true">颜色</span>
          <Select
            className="filterColorSelect"
            aria-label="按颜色筛选"
            options={colorOptions}
            value={color}
            onChange={setColor}
          />
        </div>
        <Button variant="text" size="sm" onClick={clear}>清空筛选</Button>
      </div>

      <p className="count">{list.length} 件商品</p>
      {list.length ? (
        <div className="grid">
          {list.map((product) => (
            <ProductCard key={product.id} p={product} onOpen={(item) => nav(`/product/${item.slug}`)} />
          ))}
        </div>
      ) : (
        <div className="empty">
          没有找到匹配的商品。
          <br />
          <Button variant="secondary" size="sm" onClick={clear} trailingIcon={<ArrowRight size={14} aria-hidden="true" />}>
            清空筛选
          </Button>
        </div>
      )}
    </main>
  );
}
