import {ArrowRight} from 'lucide-react';
import {LinkButton} from '../components/ui';

const posts=[
  ['01 / 层次的留白','在灰阶之间建立新的比例。','/images/editorial/ean-editorial-01.png'],
  ['02 / 软结构','让身体在衣服里自由呼吸。','/images/editorial/ean-editorial-02.png'],
  ['03 / 中性日常','不被标签定义的穿衣方式。','/images/editorial/ean-editorial-03.png'],
] as const;

export default function JournalPage(){
  return <main className="journal" aria-labelledby="journal-title">
    <small>EAN JOURNAL</small>
    <h1 id="journal-title">造型志</h1>
    <div className="journalGrid">
      {posts.map(([label,title,image])=><article key={label}>
        <img src={image} alt={label}/>
        <small>{label}</small>
        <h2>{title}</h2>
        <LinkButton to="/shop" variant="text" size="sm" trailingIcon={<ArrowRight size={14} aria-hidden="true"/>}>浏览相关商品</LinkButton>
      </article>)}
    </div>
  </main>;
}
