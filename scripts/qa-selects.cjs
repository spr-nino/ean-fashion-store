const {chromium} = require('playwright');

const baseUrl = 'http://127.0.0.1:5173';

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function parsePrice(text) {
  return Number(text.replace(/[^\d]/g, ''));
}

async function cardPrices(page) {
  return page.locator('.card strong').evaluateAll((nodes) => nodes.map((node) => node.textContent || ''));
}

async function cardNames(page) {
  return page.locator('.card h3').allInnerTexts();
}

async function assertMenuIsTopmost(page, menu, message) {
  const menuBox = await menu.boundingBox();
  assert(menuBox, `${message}：菜单没有布局尺寸`);
  const point = {
    x: menuBox.x + Math.min(menuBox.width / 2, 24),
    y: menuBox.y + Math.min(menuBox.height / 2, 24),
  };
  const menuId = await menu.getAttribute('id');
  assert(menuId, `${message}：菜单缺少 id`);
  const topmostMenuId = await page.evaluate(({x, y, expectedId}) => (
    document.elementFromPoint(x, y)?.closest('[role="listbox"]')?.id === expectedId
      ? expectedId
      : null
  ), {...point, expectedId: menuId});
  assert(topmostMenuId === menuId, `${message}：菜单被裁切或遮挡`);
}

async function selectOption(page, selectName, optionName) {
  const trigger = page.getByRole('button', {name: selectName});
  await trigger.click();
  await page.getByRole('option', {name: optionName, exact: true}).click();
  return trigger;
}

let browser;

(async () => {
  browser = await chromium.launch({
    headless: true,
    executablePath: 'C:/Users/34618/AppData/Local/ms-playwright/chromium-1243/chrome-win64/chrome.exe',
  });
  const page = await browser.newPage({viewport: {width: 1440, height: 900}});
  page.setDefaultTimeout(5000);
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`page: ${error.message}`));

  await page.goto(`${baseUrl}/shop`, {waitUntil: 'networkidle'});
  assert(await page.locator('.shopPage select').count() === 0, '商店页仍渲染原生 select');
  const defaultNames = await cardNames(page);

  const sortTrigger = page.getByRole('button', {name: '商品排序'});
  const colorTrigger = page.getByRole('button', {name: '按颜色筛选'});
  assert(await sortTrigger.getAttribute('aria-expanded') === 'false', '排序下拉初始状态异常');
  assert((await sortTrigger.innerText()).includes('推荐'), '排序默认值不是推荐');
  assert((await colorTrigger.innerText()).includes('全部颜色'), '颜色默认值不是全部颜色');

  await sortTrigger.click();
  assert(await sortTrigger.getAttribute('aria-expanded') === 'true', '排序下拉未打开');
  const sortMenu = page.getByRole('listbox', {name: '商品排序'});
  const triggerBox = await sortTrigger.boundingBox();
  const menuBox = await sortMenu.boundingBox();
  assert(triggerBox && menuBox && Math.abs(menuBox.x - triggerBox.x) < 1, '菜单未与触发按钮左侧对齐');
  assert(triggerBox && menuBox && menuBox.width >= triggerBox.width, '菜单宽度小于触发按钮');
  await assertMenuIsTopmost(page, sortMenu, '桌面排序菜单');
  const optionStyles = await sortMenu.getByRole('option').evaluateAll((options) => options.map((option) => {
    const style = getComputedStyle(option);
    return {background: style.backgroundColor, border: style.borderColor};
  }));
  assert(optionStyles.every(({background, border}) => !`${background} ${border}`.includes('rgb(0, 120, 215)')), '选项出现系统蓝色背景或边框');

  await sortTrigger.click();
  assert(await sortTrigger.getAttribute('aria-expanded') === 'false', '再次点击触发器未关闭排序菜单');
  await sortTrigger.focus();
  await page.keyboard.press('Space');
  assert(await sortTrigger.getAttribute('aria-expanded') === 'true', '空格未打开排序菜单');
  const focusedOption = page.getByRole('option', {name: '推荐', exact: true});
  await page.waitForFunction(() => document.activeElement?.getAttribute('role') === 'option');
  assert(await focusedOption.evaluate((element) => document.activeElement === element), '打开后当前选项未获得键盘焦点');
  await page.keyboard.press('ArrowDown');
  const ascendingOption = page.getByRole('option', {name: '价格从低到高', exact: true});
  assert(await ascendingOption.evaluate((element) => document.activeElement === element), 'ArrowDown 未移动选项焦点');
  await page.keyboard.press('ArrowUp');
  assert(await focusedOption.evaluate((element) => document.activeElement === element), 'ArrowUp 未移动选项焦点');
  await page.keyboard.press('Space');
  assert(await sortTrigger.getAttribute('aria-expanded') === 'false', '空格未选中并关闭菜单');

  await page.locator('.shopSearch input').click();
  assert(await sortTrigger.getAttribute('aria-expanded') === 'false', '点击外部未关闭排序菜单');

  await sortTrigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');
  let prices = (await cardPrices(page)).map(parsePrice);
  assert(prices.every((price, index) => index === 0 || prices[index - 1] <= price), '价格升序错误');
  assert(await sortTrigger.evaluate((element) => document.activeElement === element), '选择后焦点未回到排序触发按钮');

  await sortTrigger.click();
  await page.getByRole('option', {name: '价格从高到低', exact: true}).click();
  prices = (await cardPrices(page)).map(parsePrice);
  assert(prices.every((price, index) => index === 0 || prices[index - 1] >= price), '价格降序错误');

  await sortTrigger.click();
  await page.keyboard.press('Escape');
  assert(await sortTrigger.getAttribute('aria-expanded') === 'false', 'Escape 未关闭排序菜单');
  assert(await sortTrigger.evaluate((element) => document.activeElement === element), 'Escape 后焦点未回到触发按钮');

  await page.waitForTimeout(50);
  await sortTrigger.focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('Tab');
  await page.waitForTimeout(50);
  assert(await sortTrigger.getAttribute('aria-expanded') === 'false', 'Tab 离开后排序菜单未关闭');
  assert(await page.locator('.filterToggle').evaluate((element) => document.activeElement === element), 'Tab 未从下拉组件进入下一个控件');

  await selectOption(page, '商品排序', '推荐');
  assert((await sortTrigger.innerText()).includes('推荐'), '推荐顺序未恢复');
  assert(JSON.stringify(await cardNames(page)) === JSON.stringify(defaultNames), '推荐未恢复默认商品顺序');

  await selectOption(page, '按颜色筛选', '炭黑');
  assert(await page.locator('.card').count() === 3, '炭黑筛选数量错误');
  const colors = await page.locator('.card small').allInnerTexts();
  assert(colors.every((text) => text.includes('炭黑')), '颜色筛选包含非炭黑商品');
  await selectOption(page, '按颜色筛选', '全部颜色');
  assert(await page.locator('.card').count() === 10, '全部颜色未恢复所有商品');

  for (const width of [1440, 768, 390]) {
    await page.setViewportSize({width, height: width === 390 ? 844 : 900});
    await page.goto(`${baseUrl}/shop`, {waitUntil: 'networkidle'});
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), `${width}px 出现横向滚动`);
    const currentSort = page.getByRole('button', {name: '商品排序'});
    await currentSort.click();
    const currentMenu = page.getByRole('listbox', {name: '商品排序'});
    const viewport = page.viewportSize();
    const currentMenuBox = await currentMenu.boundingBox();
    assert(viewport && currentMenuBox && currentMenuBox.x >= 0 && currentMenuBox.x + currentMenuBox.width <= viewport.width, `${width}px 排序菜单超出窗口`);
    await assertMenuIsTopmost(page, currentMenu, `${width}px 排序菜单`);
    await page.keyboard.press('Escape');
    if (width > 700) {
      const currentColor = page.getByRole('button', {name: '按颜色筛选'});
      await currentColor.click();
      const currentColorMenu = page.getByRole('listbox', {name: '按颜色筛选'});
      const currentColorBox = await currentColorMenu.boundingBox();
      assert(viewport && currentColorBox && currentColorBox.x >= 0 && currentColorBox.x + currentColorBox.width <= viewport.width, `${width}px 颜色菜单超出窗口`);
      await assertMenuIsTopmost(page, currentColorMenu, `${width}px 颜色菜单`);
      await page.keyboard.press('Escape');
    }
  }

  await page.setViewportSize({width: 390, height: 844});
  await page.goto(`${baseUrl}/shop`, {waitUntil: 'networkidle'});
  await page.getByRole('button', {name: '筛选'}).click();
  const mobileColor = page.getByRole('button', {name: '按颜色筛选'});
  await mobileColor.click();
  await page.waitForTimeout(220);
  const mobileMenu = page.getByRole('listbox', {name: '按颜色筛选'});
  assert(await mobileMenu.isVisible(), '390px 颜色菜单不可见');
  const mobileMenuBox = await mobileMenu.boundingBox();
  assert(mobileMenuBox && mobileMenuBox.x >= 0 && mobileMenuBox.x + mobileMenuBox.width <= 390, '390px 颜色菜单超出窗口');
  await assertMenuIsTopmost(page, mobileMenu, '390px 颜色菜单');
  await page.getByRole('option', {name: '灰褐', exact: true}).click();
  const mobileColors = await page.locator('.card small').allInnerTexts();
  assert(mobileColors.length > 0 && mobileColors.every((text) => text.includes('灰褐')), '390px 颜色筛选失败');

  assert(errors.length === 0, `浏览器控制台错误：${errors.join(' | ')}`);
  console.log('Select QA passed: mouse, outside click, Escape, arrows, Enter, filtering, sorting, 1440/768/390 layout and console.');
})().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}).finally(async () => {
  await browser?.close();
});
