const {chromium} = require('playwright');

const routes = ['/', '/shop', '/product/ean-1', '/favorites', '/cart', '/checkout', '/order-success', '/journal', '/size-guide', '/account'];
const baseUrl = 'http://127.0.0.1:5173';

(async()=>{
  const browser=await chromium.launch({
    headless:true,
    executablePath:'C:/Users/34618/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  });
  const page=await browser.newPage({viewport:{width:1440,height:900}});
  page.setDefaultTimeout(5000);
  const errors=[];
  page.on('console', message=>{if(message.type()==='error')errors.push(`${page.url()} :: ${message.text()}`)});
  page.on('pageerror', error=>errors.push(`${page.url()} :: ${error.message}`));
  for(const route of routes){
    await page.goto(`${baseUrl}${route}`,{waitUntil:'networkidle'});
    const broken=await page.locator('img').evaluateAll(images=>images.filter(image=>!image.complete||image.naturalWidth===0).map(image=>image.getAttribute('src')));
    if(broken.length)throw new Error(`${route} has broken images: ${broken.join(', ')}`);
    console.log(`${route} ok`);
  }
  if(errors.length)throw new Error(`Browser errors:\n${errors.join('\n')}`);
  await browser.close();
  console.log('Route smoke passed: all primary routes rendered without console errors or broken images.');
})().catch(error=>{console.error(error);process.exitCode=1});
