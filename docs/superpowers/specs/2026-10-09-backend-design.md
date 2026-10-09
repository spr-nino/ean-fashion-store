# EAN 后端设计：商品 / 购物车 / 订单落库

日期：2026-10-09
状态：已获用户批准，待实现

## 1. 背景与目标

EAN 独立站目前是纯前端演示项目（React 19 + Vite + React Router + Clerk），商品硬编码在 `src/data/products.ts`，购物车/收藏/订单存 localStorage。本期目标：新增 Node.js + TypeScript 后端与 SQLite 数据库，把**商品、购物车、收藏、订单**四类数据落库，本地开发环境完整跑通。

### 已定决策（来自需求澄清）

| 决策点 | 结论 |
|---|---|
| 后端技术栈 | Node.js + TypeScript（Hono 框架） |
| 数据库 | SQLite + Prisma ORM |
| 购物车/收藏归属 | 未登录存 localStorage，登录后合并到服务端 |
| 商品维护方式 | seed 脚本灌库，后端只读 API；管理后台后续单独立项 |
| 本期范围 | 仅本地开发，不做部署 |

### 明确不做（YAGNI）

真实支付、库存管理、订单状态机流转、管理后台、服务端搜索/筛选、地址簿、运费模板、游客下单、部署上线、订单幂等键。

## 2. 架构与目录

```
独立站/
├── src/                  # 现有前端
├── shared/
│   └── types.ts          # 前后端共用 API DTO 类型
├── server/               # 新增，独立 package.json
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.ts       # 现有 10 件商品迁移至此
│   ├── .env              # DATABASE_URL / CLERK_SECRET_KEY（不入库）
│   └── src/
│       ├── index.ts      # Hono 入口
│       ├── auth.ts       # Clerk JWT 验证中间件
│       ├── db.ts         # PrismaClient 单例
│       └── routes/       # products / cart / favorites / orders
└── package.json          # 根包加 concurrently
```

- 前端 `:5173`，后端 `:3001`；`vite.config.ts` 增加 `server.proxy: { '/api': 'http://localhost:3001' }`。前端只写相对路径 `/api/...`。
- 根 `package.json` 脚本：
  - `dev`: `concurrently "npm:dev:web" "npm:dev:server"`
  - `dev:web`: `vite`
  - `dev:server`: `npm --prefix server run dev`
- server 包脚本：`dev`（tsx watch）、`typecheck`（tsc --noEmit）、`db:migrate`（prisma migrate dev）、`db:seed`（prisma db seed）。
- 后端依赖：`hono`、`@hono/node-server`、`@clerk/backend`、`zod`、`prisma`、`@prisma/client`、`tsx`、`typescript`。

**技术约束**：Prisma + SQLite 不支持 Json 列。`sizes` / `images` / `tags` 以 JSON 字符串存库，API 层序列化/反序列化；对外 API 返回正常数组。

## 3. 数据模型

```prisma
generator client { provider = "prisma-client-js" }
datasource db { provider = "sqlite"; url = env("DATABASE_URL") }

model Product {
  id          String      @id
  slug        String      @unique
  name        String
  en          String
  cat         String
  price       Int         // 单位：元，与现有前端一致
  color       String
  sizes       String      // JSON 数组字符串
  images      String      // JSON 数组字符串
  description String
  fabric      String
  care        String
  model       String
  isNew       Boolean
  featured    Boolean
  tags        String      // JSON 数组字符串
  cartItems   CartItem[]
  favorites   Favorite[]
  orderItems  OrderItem[]
}

model CartItem {
  id        String  @id @default(cuid())
  userId    String
  productId String
  product   Product @relation(fields: [productId], references: [id])
  size      String
  color     String
  qty       Int
  price     Int     // 加入时快照价

  @@unique([userId, productId, size, color])
  @@index([userId])
}

model Favorite {
  id        String   @id @default(cuid())
  userId    String
  productId String
  product   Product  @relation(fields: [productId], references: [id])
  createdAt DateTime @default(now())

  @@unique([userId, productId])
}

model Order {
  id          String      @id   // 沿用现有格式：EAN + 时间戳后 8 位
  userId      String
  total       Int
  shippingFee Int
  name        String      // 收货人（现前端收集了却丢弃，本期起落库）
  phone       String
  address     String
  status      String      @default("PLACED")
  createdAt   DateTime    @default(now())
  items       OrderItem[]

  @@index([userId])
}

model OrderItem {
  id        String  @id @default(cuid())
  orderId   String
  order     Order   @relation(fields: [orderId], references: [id], onDelete: Cascade)
  productId String
  product   Product @relation(fields: [productId], references: [id])
  name      String  // 下单时商品名快照
  price     Int     // 下单时单价快照
  size      String
  color     String
  qty       Int
}
```

## 4. API 规格

错误统一格式 `{ "error": "人类可读中文信息" }`；zod 校验失败 400；未认证 401；资源不存在或不属于当前用户 404（不泄露存在性）。

### 公开接口

| 方法 | 路径 | 响应 |
|---|---|---|
| GET | `/api/products` | `Product[]`（全量 10 件；前端继续本地筛选/搜索/排序） |
| GET | `/api/products/:slug` | `Product`，不存在 404 |

### 认证接口（`Authorization: Bearer <Clerk JWT>`）

中间件用 `@clerk/backend` 验签，取 `userId` 注入上下文。

| 方法 | 路径 | 请求体 | 响应 / 语义 |
|---|---|---|---|
| GET | `/api/cart` | — | `CartItemDTO[]` |
| POST | `/api/cart` | `{productId, size, color, qty}` | 同 (userId,productId,size,color) 存在则 qty 累加（与现有前端加购语义一致）；返回更新后的整袋 |
| PATCH | `/api/cart/:id` | `{qty}` | qty<1 时删除该项（沿用现有前端 update 语义）；返回整袋 |
| DELETE | `/api/cart/:id` | — | 返回整袋 |
| POST | `/api/cart/merge` | `{items: [{productId, size, color, qty}]}` | 本地袋并入服务端：逐条按累加语义 upsert；productId 不存在的跳过；返回合并后整袋 |
| GET | `/api/favorites` | — | `string[]`（productId 列表，与现有前端 favorites 形态一致） |
| POST | `/api/favorites/:productId` | — | toggle：存在则删、不存在则加；返回 `{favorited: boolean}` |
| POST | `/api/favorites/merge` | `{productIds: string[]}` | 并集合并；返回合并后完整列表 |
| POST | `/api/orders` | `{name, phone, address}` | 服务端读购物车→非空校验→**按 Product 表现价重算** total 与 shippingFee（满 999 免运，否则 39）→写 Order+OrderItem 快照→清空服务端购物车→返回完整订单 |
| GET | `/api/orders` | — | 当前用户订单列表（含 items），按 createdAt 倒序 |
| GET | `/api/orders/:id` | — | 单笔订单，仅本人 |

### 入参校验规则（zod）

- `qty`: 整数，1–99
- `phone`: `^1\d{10}$`（与现有前端正则一致）
- `name` / `address`: trim 后非空
- `size`: 必须在该商品 `sizes` 内；`color` 必须等于该商品当前 `color`（单颜色现状）
- `productId` 必须存在，否则 400（merge 接口例外：跳过并继续）

## 5. 前端改造

原则：**`Ctx` 接口对组件保持兼容，组件零改动或最小改动**。

1. **`src/lib/api.ts`（新增）**：fetch 封装，自动从 Clerk `getToken()` 取 token 带 Authorization 头；统一解析 `{error}`。
2. **商品数据源**：新增 `ProductsContext`（启动时请求一次 `/api/products`，缓存 `{products, loading, error}`）。ShopPage / HomePage / ProductPage 从 context 读；ProductPage 增加加载中与不存在两种状态（现在是同步查找）。
   - `src/data/products.ts` 内容迁至 `server/prisma/seed.ts`（数据形态不变）；前端该文件删除，组件改从 context 取数。
   - `scripts/check-images.mjs` 不读 products.ts（已确认），不受影响。
3. **`StoreContext` 重写**：
   - 未登录：维持现有 localStorage 行为（仅购物车/收藏；订单本就需登录查看）。
   - 已登录：监听 Clerk 登录态，**登录瞬间**把本地购物车/收藏分别调 merge 接口，成功后清空本地副本、以服务端状态为准；此后所有变更操作 = 乐观更新本地状态 + 调 API（失败回滚并 Toast 提示）。
   - 退出登录：本地状态清空回匿名模式（服务端购物车仍在，重新登录即恢复——与主流电商一致）。
   - `placeOrder` 签名改为 `placeOrder(info: {name, phone, address}) => Promise<OrderDTO | null>`，调 `POST /api/orders`。
4. **CheckoutPage**：未登录时显示引导登录页（Clerk `<RedirectToSignIn>`，与 AccountPage 同款）；已登录正常走表单，提交后跳订单成功页展示服务端返回的订单。⚠️ 这是本期唯一的 UX 变化：**结算需登录**（已获用户确认）。
5. **AccountPage**：历史订单改从 `GET /api/orders` 读取。

## 6. 环境变量与密钥

- `server/.env`（加入 .gitignore）：
  - `DATABASE_URL="file:./dev.db"`
  - `CLERK_SECRET_KEY=sk_test_...`（来自现有 Clerk 开发实例，与前端 publishable key 同实例）
  - `PORT=3001`
- 前端 `VITE_CLERK_PUBLISHABLE_KEY` 不变。
- `server/prisma/dev.db` 加入 .gitignore。
- README 更新运行步骤（新增 server 安装、迁移、seed）。

## 7. 错误处理

- Hono 全局 `onError`：未捕获异常 → 500 `{error:"服务器开小差了，请稍后再试"}`，日志打到 server 控制台。
- zod `safeParse` 失败 → 400，取第一条 issue 信息。
- Clerk 验签失败 / token 缺失 → 401 `{error:"请先登录"}`。
- 前端 API 失败：保留本地状态，复用现有 Toast 模式提示；合并接口失败不阻塞用户使用（本地数据仍在）。

## 8. 验证与测试

- seed 可重复执行（`upsert` by slug）。
- `npm run lint`、`npm run build`、server `npm run typecheck` 全绿。
- curl 冒烟清单（实现文档中附）：
  - `GET /api/products` 返回 10 件
  - 无 token 调 `GET /api/cart` → 401
  - 带 token 走通 add→PATCH→DELETE→merge
  - `POST /api/orders` 空袋 → 400；正常下单 → 订单含快照字段且购物车被清空
- Playwright QA 脚本适配：`qa-routes.cjs` 的 `/checkout` 改为期望登录引导页；`qa-buttons.cjs` 的结算用例接入 Clerk 测试账号登录态（开发实例测试验证码流程）。其余用例不变。
- 手动验收路径：匿名加购 → 登录 → 本地袋合并进账户 → 换浏览器登录同账号看到购物车 → 下单 → AccountPage 出现订单 → 商品表改价后历史订单金额不变（快照验证）。

## 9. 边界情况

| 场景 | 行为 |
|---|---|
| merge 时本地袋含已不存在的商品 | 跳过该条，继续其余；返回的整袋即真相 |
| PATCH/DELETE 他人购物车项 | 404 |
| 下单时袋中商品已下架 | 整单 400，提示商品不可用（本期商品不会被删，防御性校验） |
| 重复点击提交订单 | 前端 loading 禁用（已有）；后端不额外做幂等 |
| 商品改价后 | 历史订单金额不变（OrderItem 快照）；购物车中价格字段为加入时快照，以结算时重算为准 |
| 服务端购物车商品被删后打开购物袋 | GET /api/cart 联表过滤掉已不存在商品 |

## 10. 实施顺序预览（详细计划另出）

1. server 脚手架 + Prisma schema + migrate + seed
2. 公开商品 API + 前端 ProductsContext 切换
3. Clerk 验证中间件 + 购物车/收藏 API + StoreContext 改造 + 登录合并
4. 订单 API + CheckoutPage / AccountPage 改造
5. QA 脚本适配 + README + 全量验证
