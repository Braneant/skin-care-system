# 基于 AI 大模型 + 微信小程序的肌肤养护管理系统

> 项目代号：`skin_care_system` · 版本 v1.0（MVP）
> 三端协同：普通用户智能护肤（小程序端）+ 医护顾问专业赋能（医生工作台）+ 管理员高效运维（管理端）

## 一、项目结构

```
├── docs/          # PRD、项目规划、架构设计文档
├── server/        # 后端（Node.js + Express + SQLite）
├── admin-web/     # 管理端/医生端（Vue3 + Vite + Element Plus）
├── miniapp/       # 小程序端（uni-app Vue3 + Vite）
└── README.md
```

## 二、技术栈

| 端 | 技术选型 |
|---|---|
| 后端 | Node.js ≥18、Express、better-sqlite3、JWT、bcryptjs、可插拔 AI 层（DeepSeek / 本地启发式引擎） |
| 管理端 | Vue3 + Vite + TypeScript + Element Plus + Pinia + Vue Router + ECharts |
| 小程序端 | uni-app（Vue3 + Vite），可编译微信小程序 / H5 |

## 三、快速启动

### 1. 后端（server/）

```bash
cd server
npm install
cp .env.example .env   # 首次运行：复制并修改环境变量（JWT_SECRET 必填）
npm run dev
```

- 默认端口 `3000`
- 健康检查：<http://localhost:3000/api/health>，返回 `{"code":0,...}`
- 启动时自动建表（19 张核心表）+ 播种种子数据

### 2. 管理端（admin-web/）

```bash
cd admin-web
npm install
npm run dev        # 开发（默认 http://localhost:5173，已代理 /api 到 3000）
npm run build      # 生产构建
```

### 3. 小程序端（miniapp/）

```bash
cd miniapp
npm install
npm run dev:h5          # H5 预览（默认 http://localhost:8080，已代理 /api）
npm run dev:mp-weixin   # 编译微信小程序（产物在 dist/dev/mp-weixin）
```

> H5 开发时代理了 `/api` 到 `http://localhost:3000`，请先启动后端。
> 微信小程序真机联调需将 `src/api/request.ts` 中 `BASE_URL` 改为服务器域名并配置合法域名。

## 四、环境变量（server/.env）

| 变量 | 说明 |
|---|---|
| `PORT` | 服务端口，默认 3000 |
| `JWT_SECRET` | JWT 密钥（**必填**，生产务必修改） |
| `JWT_EXPIRES_IN` / `JWT_REFRESH_EXPIRES_IN` | token 有效期，默认 2h / 7d |
| `WX_APPID` / `WX_SECRET` | 微信小程序凭证（无则走开发兜底 openid） |
| `DEEPSEEK_API_KEY` | DeepSeek Key（无则 `AI_PROVIDER=auto` 自动走本地引擎） |
| `DEEPSEEK_BASE_URL` / `DEEPSEEK_CHAT_MODEL` / `DEEPSEEK_VISION_MODEL` | DeepSeek 配置（视觉模型名不硬编码） |
| `AI_PROVIDER` | `auto` / `deepseek` / `local` |
| `AI_TIMEOUT_MS` / `AI_MAX_RETRY` | AI 超时与重试次数 |
| `MAX_IMAGE_SIZE_MB` / `IMAGE_MAX_EDGE` | 图片限制与压缩最长边 |
| `DB_PATH` / `UPLOAD_DIR` | SQLite 路径 / 上传目录 |
| `CORS_ORIGINS` | 跨域白名单（逗号分隔） |

## 五、默认账号（种子数据）

| 角色 | 账号 | 密码 |
|---|---|---|
| 系统管理员 | `admin` | `admin123` |
| 医生/医护顾问 | `doctor` | `doctor123` |

> 小程序端使用微信授权登录，无 Key 时可用任意 code 走开发兜底自动建档。

## 六、核心特性

- **双鉴权隔离**：`/api/wx/*`（Header `Wx-Authorization`）、`/api/admin/*`（Header `Authorization`），物理隔离互不通用。
- **RBAC 动态菜单**：后端返回权限树，管理端递归渲染菜单 + 动态路由 + 接口级鉴权。
- **AI 可插拔 + 降级链**：DeepSeek → 重试 1 次 → 本地色彩学启发式引擎，返回 `engine` / `degraded` 标记。
- **图片处理降级**：优先 `sharp`，不可用自动降级纯 JS `jimp`（`server/src/services/ai/imageUtils.js` 内部隔离）。
- **统一响应**：`{ code, msg, data }`，`code=0` 成功。

## 七、已知说明

- AI 检测在未配置 `DEEPSEEK_API_KEY` 时由本地启发式引擎生成结果（`engine=local`）。
- 微信登录在未配置 `WX_APPID/WX_SECRET` 时使用开发兜底 openid，留待联调。
- 趋势图采用轻量 CSS 柱状图实现（未引入 uCharts，规避跨端依赖体积）。

## 八、如何体验（他人访问本仓库）

本项目主体是**微信小程序 + 后端**。微信小程序只能在**手机微信**内运行，PC 端（浏览器 / 微信开发者工具）主要用于开发与调试。若你访问本仓库、但在 PC 上无法直接运行小程序，可按以下方式体验：

### 方式一：微信扫码体验（最贴近真实使用）
- **体验版**：作者在微信开发者工具「上传」代码 → 微信公众平台将版本设为「体验版」→ 后台「成员管理」把体验者微信号加入「体验成员」→ 体验者用微信扫描体验版二维码即可。
- **预览二维码**：作者在微信开发者工具点击「预览」生成二维码（临时有效），体验者用微信扫码打开。
- **前提**：手机微信；体验版需被加入体验成员（或预览二维码未过期）；后端服务对手机可访问（公网地址，或与开发者处于同一局域网）。

### 方式二：H5 在线体验（无需微信，最省事）
- 项目基于 uni-app，可直接编译为 H5：
  ```bash
  cd miniapp && npm run build:h5   # 产物在 miniapp/dist/build/h5
  ```
- 将产物部署到任意静态托管（GitHub Pages / Vercel / Netlify），并把 H5 的接口地址指向已部署的后端。
- 体验者用**浏览器（电脑或手机均可）**打开链接即可体验主要页面与交互，无需安装微信开发者工具。
- **前提**：已部署的 H5 链接 + 后端公网 HTTPS 地址；微信授权登录在 H5 下不适用（可用演示数据降级）。

### 方式三：本地自建运行（技术门槛最高）
```bash
# 1) 启动后端
cd server && npm install && cp .env.example .env && npm run dev
# 2) 编译小程序
cd miniapp && npm install && npm run build:mp-weixin
# 3) 用「微信开发者工具」导入 miniapp/dist/build/mp-weixin
```
- **前提**：Node.js ≥18、微信开发者工具、可用的小程序 AppID（可用测试号）。

### 前提条件速查
| 体验方式 | 需要什么 | 是否需要微信 |
|---|---|---|
| 微信扫码（体验版 / 预览） | 手机微信 + 有效二维码 / 体验成员权限 + 后端可访问 | 是 |
| H5 在线体验 | 已部署的 H5 链接 + 后端公网地址 | 否 |
| 本地自建运行 | Node.js + 微信开发者工具 + AppID | 是（调试用） |

> 简言之：**想看小程序本体，必须用手机微信扫码（体验版/预览）；想在电脑上快速看效果，走 H5 在线体验最省事。**
