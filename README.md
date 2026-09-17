# EAN Fashion Store

EAN 是一个以日系中性服装为核心的独立站演示项目，支持商品浏览、搜索筛选、动态详情、收藏、购物袋、模拟结算、订单成功页和造型志。

## 本地运行

```bash
npm install
npm run dev
```

## 验证命令

```bash
npm run lint
npm run check:images
npm run build
```

端到端按钮流程可使用本地 Playwright 运行：

```bash
node scripts/qa-buttons.cjs
```

该检查覆盖首页 CTA、导航、商品收藏、快捷尺码选择与加购、购物袋数量、结算校验和 loading、订单成功页，以及 390px 移动端菜单、筛选抽屉和横向溢出。

## 图片来源

商品图来自 Unsplash Source 的固定摄影资源，已下载到 `public/images/products/` 并压缩为 WebP；首屏和造型志图片使用项目内已有视觉素材，存放于 `public/images/editorial/` 与 `public/images/fallback/`。页面不依赖运行时远程图片。
