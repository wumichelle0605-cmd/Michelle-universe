# 玄学综合 · xuanxue-app

一个纯前端的多算法命理工具站，所有计算在你浏览器本地完成，**不上传任何数据**。

## 功能模块

| 路径 | 模块 | 数据来源 |
|---|---|---|
| `/` | 首页 / 出生档案 | localStorage |
| `/reading` | 我的命盘（八字 + 紫微 + 占星 Tab 切换） | `taibu-core` 真实计算 |
| `/daily` | 今日运势聚合（4 个算法的当日吉凶得分） | `taibu-core` |
| `/diary` | 日记（记录当日真实感受 + 算法得分快照） | Dexie / IndexedDB |
| `/dashboard` | 准确率看板（命中率 + Pearson 相关系数） | 本地统计 |
| `/influencers` | 大V收藏（仅链接 + RSS，**不抓取内容**） | Dexie |

## 关键设计

- **可信计算**：所有算法均调用 [`taibu-core`](https://www.npmjs.com/package/taibu-core)，底层是 `lunar-javascript`、`tyme4ts`、`iztro`、`circular-natal-horoscope-js` 等真实库；**没有任何一处使用 LLM 编造结果**。
- **隐私优先**：出生信息 / 日记 / 收藏全部存浏览器本地（localStorage + IndexedDB）。
- **零后端**：纯静态，任何静态托管平台（Cloudflare Pages / Vercel / Netlify / GitHub Pages）都能跑。

## 本地开发

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # 生成 dist/
npm run preview      # 预览生产构建
```

## 部署到 Cloudflare Pages（推荐）

1. 把 `xuanxue-app/` 推到一个 Git 仓库（GitHub / GitLab / Bitbucket）
2. 登录 [Cloudflare Pages](https://pages.cloudflare.com/) → Create project → Connect to Git
3. 选择仓库，构建配置：
   - **Framework preset**: `Vite`
   - **Build command**: `npm run build`
   - **Build output directory**: `dist`
   - **Node version** (环境变量): `NODE_VERSION = 20`（或 22）
4. 部署完成后会得到 `https://xxx.pages.dev` 域名，可绑定自定义域名

> 如果不想用 Git，也可以本地 `npm run build` 后用 `npx wrangler pages deploy dist` 一键上传。

## 部署到 Vercel

同上：连接仓库 → Framework 选 Vite → 一键部署。

## 已知限制

- 占星模块（`circular-natal-horoscope-js`）依赖部分 Node 内置模块，在浏览器构建时会有 externalize 警告。已用 try/catch 容错，失败也不会影响其他算法。如需更精准的占星，未来可改接 [`swisseph-wasm`](https://github.com/timotejroiko/sweph-wasm)。
- 当前打包后 ~7MB（gzip 2.4MB），主要是 `taibu-core` + `iztro` 体积。后续可用 `import()` 动态拆包，把紫微/占星按需加载。
- 大V聚合**仅做链接收藏**，刻意不抓取正文，避免版权与反爬风险。如果要做"运势 timeline"，建议接 [RSSHub](https://docs.rsshub.app/) 等 RSS 源。

## 目录结构

```
xuanxue-app/
├── src/
│   ├── App.tsx                # 路由
│   ├── main.tsx
│   ├── index.css              # Tailwind v4 + 主题
│   ├── components/Layout.tsx  # 全站导航
│   ├── lib/
│   │   ├── store.ts           # zustand 用户档案
│   │   ├── db.ts              # Dexie 日记/收藏
│   │   └── calc.ts            # 算法封装（核心）
│   └── pages/
│       ├── Home.tsx
│       ├── Reading.tsx
│       ├── DailyFortune.tsx
│       ├── Diary.tsx
│       ├── Dashboard.tsx
│       └── Influencers.tsx
├── index.html
├── vite.config.ts
└── package.json
```

## 路线图（v2 候选）

- [ ] 紫微"飞星 / 四化"详细解读
- [ ] 占星接 swisseph-wasm 提升精度
- [ ] 梅花 / 六爻 / 塔罗 也接入排盘大厅
- [ ] 数据导入导出（JSON 备份）
- [ ] PWA 离线可用
- [ ] 把 Dart Shelf 老版本（`bazi_web/`）作为对照接口接入
