'use strict';

/**
 * 启动入口：校验配置 → 初始化数据库（建表+播种）→ 监听端口
 */
const { config, validateConfig } = require('./config');

// 校验关键配置（缺失 JWT_SECRET 时报错）
validateConfig();

// 初始化数据库（建表 + 种子数据）
const database = require('./config/database');
database.getDb();

const app = require('./app');
const logger = require('./utils/logger');

const server = app.listen(config.port, () => {
  logger.info(`✅ 肌肤养护管理系统后端已启动：http://localhost:${config.port}`);
  logger.info(`   健康检查：http://localhost:${config.port}/api/health`);
  logger.info(`   AI Provider：${config.aiProvider}${config.deepseekApiKey ? '（DeepSeek 已配置）' : '（未配置 Key，走本地引擎）'}`);
});

// 优雅退出
function shutdown() {
  logger.info('正在关闭服务...');
  server.close(() => process.exit(0));
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

module.exports = server;
