import fs from 'node:fs';import path from 'node:path';const dir=path.join(process.cwd(),'public/images/products');const files=fs.readdirSync(dir).filter(x=>x.endsWith('.webp'));const missing=[];for(let i=1;i<=8;i++){for(const side of ['01','02']){const f=`ean-product-${String(i).padStart(2,'0')}-${side}.webp`;if(!files.includes(f))missing.push(f)}}if(missing.length){console.error('Missing images:',missing);process.exit(1)}console.log(`Image check passed: ${files.length} local product assets found.`);


