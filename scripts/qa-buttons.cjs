const {chromium} = require('playwright');

const baseUrl = process.env.QA_BASE_URL || 'http://127.0.0.1:5173';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/34618/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  });
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('console', message => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', error => errors.push(`page: ${error.message}`));

  await page.goto(baseUrl, {waitUntil: 'domcontentloaded'});
  await page.evaluate(() => localStorage.clear());
  await page.reload({waitUntil: 'domcontentloaded'});
  assert(await page.getByRole('heading', {name: '留白之下，自有轮廓。'}).count(), '首页标题未渲染');
  assert(!(await page.getByRole('button', {name: '打开导航菜单'}).isVisible()), '桌面端不应显示移动菜单按钮');
  await page.getByRole('link', {name: '探索新季系列'}).click();
  await page.waitForURL('**/shop');
  await page.getByRole('heading', {name: '商店 / Shop'}).waitFor();
  assert(page.url().endsWith('/shop'), '首页 CTA 未进入商店');
  const cardCount = await page.locator('.card').count();
  assert(cardCount >= 8, '商品列表数量异常');
  const unnamedButtons = await page.locator('button').evaluateAll(buttons => buttons
    .filter(button => !button.getAttribute('aria-label') && !button.textContent?.trim())
    .map(button => button.outerHTML.slice(0, 120)));
  assert(unnamedButtons.length === 0, `存在无障碍名称的按钮：${unnamedButtons.join(' | ')}`);
  assert(!/[⌕♡♥☰＋−]/u.test(await page.locator('body').innerText()), '页面仍有旧 Unicode 图标');

  const favorite = page.locator('.card .fav').first();
  await favorite.click();
  await page.waitForURL('**/sign-in**');
  assert(page.url().includes('redirect_url'), '未登录收藏跳转缺少回跳参数');
  await page.goto(`${baseUrl}/shop`, {waitUntil: 'domcontentloaded'});
  await page.getByRole('heading', {name: '商店 / Shop'}).waitFor();

  const keyboardQuickTrigger = page.locator('.quick-panel__trigger').first();
  await keyboardQuickTrigger.focus();
  assert(await keyboardQuickTrigger.evaluate(node => document.activeElement === node), '快捷购买按钮不可键盘访问');
  assert(await keyboardQuickTrigger.evaluate(node => Number.parseFloat(getComputedStyle(node.parentElement).opacity) > 0), '快捷购买按钮获得焦点后未显示');
  await page.hover('.card .fav');
  const favoriteHoverBackground = await page.locator('.card .fav').first().evaluate(node => getComputedStyle(node).backgroundColor);
  assert(favoriteHoverBackground !== 'rgb(23, 23, 23)', '收藏图标 hover 变成实心黑块');
  await keyboardQuickTrigger.click();
  const quickPanel = page.locator('.quick-panel.is-open').first();
  assert(await quickPanel.count(), '快捷购买尺码面板未展开');
  await quickPanel.getByRole('button', {name: 'M', exact: true}).click();
  await quickPanel.getByRole('button', {name: '加入购物袋'}).click();
  await page.waitForTimeout(100);
  assert(await page.getByText('已加入购物袋 ✓').count(), '快捷加入成功反馈未显示');
  assert(await page.locator('.cart-badge').innerText() === '1', '购物袋数量未更新');

  await page.getByRole('link', {name: /购物袋，1件商品/}).click();
  await page.waitForURL('**/cart');
  await page.getByRole('heading', {name: '购物袋'}).waitFor();
  assert(await page.locator('.cartItem').count() === 1, '购物袋商品未渲染');
  const quantityValue = page.locator('.cartItem .qty > span').first();
  assert(await page.getByRole('button', {name: /减少.*数量/}).isDisabled(), '数量为 1 时减号未禁用');
  await page.getByRole('button', {name: /增加.*数量/}).click();
  await expectText(quantityValue, '2', '购物袋数量增加失败');

  await page.getByRole('button', {name: '进入演示结算'}).click();
  await page.waitForURL('**/checkout');
  await page.getByRole('heading', {name: '演示结算'}).waitFor();
  const submit = page.locator('.checkoutButton');
  await submit.click();
  assert(await page.getByRole('alert').innerText() === '请填写收货人姓名', '结算校验反馈异常');
  await page.fill('#checkout-address-name', '测试用户');
  await page.fill('#checkout-address-phone', '13800138000');
  await page.fill('#checkout-address-province', '上海市');
  await page.fill('#checkout-address-city', '上海市');
  await page.fill('#checkout-address-detail', '静安区测试路 1 号');
  await page.fill('#checkout-address-postcode', '200000');
  await submit.click();
  assert(await submit.isDisabled(), '提交 loading 未禁止重复点击');
  await page.waitForURL('**/payment/**');
  await page.getByRole('heading', {name: '模拟收银台'}).waitFor();

  const simToggle = page.getByRole('checkbox', {name: /模拟支付失败/});
  await simToggle.check();
  await page.getByRole('button', {name: /确认支付/}).click();
  await page.getByRole('alert').waitFor();
  assert(await page.getByRole('alert').innerText() === '模拟支付失败，请重试', '模拟支付失败反馈异常');
  assert(page.url().includes('/payment/'), '支付失败后不应离开收银台');
  await simToggle.uncheck();
  await page.getByRole('button', {name: /确认支付/}).click();
  await page.waitForURL('**/order-success');
  await page.getByRole('heading', {name: '感谢你的选择。'}).waitFor();

  await page.goto(`${baseUrl}/product/ean-2`, {waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: 'M', exact: true}).click();
  await page.locator('.productAdd').click();
  await page.waitForTimeout(500);
  await page.getByRole('link', {name: /购物袋/}).click();
  await page.waitForURL('**/cart');
  await page.getByRole('button', {name: '进入演示结算'}).click();
  await page.waitForURL('**/checkout');
  await page.fill('#checkout-address-name', '测试用户');
  await page.fill('#checkout-address-phone', '13800138000');
  await page.fill('#checkout-address-province', '上海市');
  await page.fill('#checkout-address-city', '上海市');
  await page.fill('#checkout-address-detail', '静安区测试路 1 号');
  await page.fill('#checkout-address-postcode', '200000');
  await page.locator('.checkoutButton').click();
  await page.waitForURL('**/payment/**');
  await page.getByRole('button', {name: '取消订单'}).click();
  await page.getByRole('button', {name: '确认取消?'}).click();
  await page.getByRole('heading', {name: '订单已取消'}).waitFor();

  await page.setViewportSize({width: 390, height: 844});
  await page.goto(`${baseUrl}/shop`, {waitUntil: 'networkidle'});
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= 390), '商店页存在横向溢出');
  await page.getByRole('button', {name: '筛选'}).click();
  assert(await page.locator('.shopFilters.is-open').count(), '移动筛选抽屉未打开');
  await page.getByRole('button', {name: '关闭筛选'}).click();

  await page.goto(baseUrl, {waitUntil: 'networkidle'});
  await page.getByRole('button', {name: '打开导航菜单'}).click();
  assert(await page.locator('#primary-nav.open').count(), '移动导航未打开');
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= 390), '首页存在横向溢出');

  await page.setViewportSize({width: 1440, height: 900});
  await page.evaluate(() => localStorage.clear());
  await page.goto(`${baseUrl}/product/ean-1`, {waitUntil: 'domcontentloaded'});
  await page.getByRole('heading', {name: '无界长款大衣'}).waitFor();
  const mainImage = page.locator('.gallery > img');
  const firstImage = await mainImage.getAttribute('src');
  await page.locator('.gallery button').nth(1).click();
  assert(await mainImage.getAttribute('src') !== firstImage, '商品详情图集切换失败');
  await page.getByRole('button', {name: '加入购物袋'}).click();
  assert(await page.getByText('请先选择尺码').count(), '未选尺码时未阻止加入购物袋');
  await page.getByRole('button', {name: 'M', exact: true}).click();
  const productAdd = page.locator('.productAdd');
  await productAdd.click();
  assert(await productAdd.isDisabled(), '商品详情加入按钮未进入 loading/disabled');
  await page.waitForTimeout(500);
  assert(await page.getByText('已加入购物袋').count(), '商品详情加入反馈未显示');
  const favoriteAction = page.getByRole('button', {name: '收藏商品'});
  await favoriteAction.click();
  assert(await page.getByRole('button', {name: '已收藏'}).count(), '商品详情收藏失败');
  await page.reload({waitUntil: 'domcontentloaded'});
  await page.getByRole('button', {name: '已收藏'}).waitFor();
  await page.goto(`${baseUrl}/favorites`, {waitUntil: 'domcontentloaded'});
  await page.getByRole('heading', {name: '登录'}).waitFor();
  await page.goto(`${baseUrl}/account`, {waitUntil: 'domcontentloaded'});
  assert(await page.getByRole('heading', {name: '登录'}).count(), '账户路由未打开');
  assert(errors.length === 0, `浏览器控制台错误：${errors.join(' | ')}`);

  console.log('Browser QA passed: CTA, navigation, favorite auth gate, quick add, cart quantity, checkout validation/loading, cashier failure/retry, cashier cancel, order success, 390px menu/filter and overflow.');
  await browser.close();
})().catch(error => {
  console.error(error);
  process.exitCode = 1;
});

async function expectText(locator, expected, message) {
  for (let i = 0; i < 20; i += 1) {
    if ((await locator.innerText()) === expected) return;
    await new Promise(resolve => setTimeout(resolve, 50));
  }
  throw new Error(message);
}


