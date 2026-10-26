# 项目长期记忆 — 肌肤养护管理系统

## 技术栈约定（勿擅自变更）
- 后端 Node.js + Express + better-sqlite3（CommonJS）；SQLite 可迁移 MySQL。
- 管理端 Vue3 + Vite + Element Plus + Pinia + ECharts。
- 小程序端 uni-app（Vue3 + Vite），编译微信小程序/H5。
- 认证 JWT 无状态 + RBAC；双鉴权隔离：`/api/wx/*` 用 `Wx-Authorization`，`/api/admin/*` 用 `Authorization`；后台用户与小程序用户分表（admin_users / wx_users）。

## AI 约定
- 用户 AI Provider = **DeepSeek**（有 Key，无 Qwen/阿里云百炼）。
- 文本模型 `deepseek-chat`；视觉模型 `deepseek-v4-flash-vision-exp`（实验版，必须放 .env 配置项，禁止硬编码到业务代码）。
- 可插拔 Provider + 降级链：DeepSeek → 重试1次 → 本地启发式引擎（无 Key/失败/离线兜底）。
- 图片上传后压缩（最长边约800px），AI 要求结构化 JSON 输出 + 服务端字段校验。

## 关键约定
- 统一响应 `res.ok(data)/res.fail(code,msg)`，控制器禁裸 res.json。
- `responseMiddleware` 必须注册在 `express.json()` 之前（否则非法 JSON 泄漏堆栈）。
- baseRepo 软删除布尔字段名为 `softDeleteEnabled`（勿命名 softDelete 遮蔽方法）。
- 默认账号 admin/admin123（管理员）、doctor/doctor123（医生）。
- **小程序 WXSS 类名必须为 ASCII**：`<style>` 中禁止中文类名（如 `.r-低`），否则编译成 WXSS 会被转义成 `\4f4e` 导致 `unexpected '\'` 编译失败；中文只用于文本内容或 `:class` 运行时值（映射到 ASCII 类）。
- `project.config.json` 的 `libVersion` 不能为空：构建后用 `miniapp/scripts/patch-mp-config.js` 设为 `3.17.3`、`minified` 设 `false`，规避开发者工具构建服务报错。
