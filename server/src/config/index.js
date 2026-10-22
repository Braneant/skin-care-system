'use strict';

/**
 * 全局配置对象
 * 读取 .env（通过 dotenv），导出统一配置，缺失关键项时报错提示。
 */
const path = require('path');
const dotenv = require('dotenv');

// 从项目根目录（server/）加载 .env
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

/**
 * 解析逗号分隔的字符串为数组（去空白、去空项）
 * @param {string|undefined} value
 * @param {string[]} fallback
 * @returns {string[]}
 */
function toArray(value, fallback = []) {
  if (!value) return fallback;
  return String(value)
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
}

const config = {
  // 服务
  port: parseInt(process.env.PORT || '3000', 10),

  // JWT
  jwtSecret: process.env.JWT_SECRET || '',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '2h',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',

  // 微信
  wxAppid: process.env.WX_APPID || '',
  wxSecret: process.env.WX_SECRET || '',

  // DeepSeek
  deepseekApiKey: process.env.DEEPSEEK_API_KEY || '',
  deepseekBaseUrl: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
  deepseekChatModel: process.env.DEEPSEEK_CHAT_MODEL || 'deepseek-chat',
  deepseekVisionModel:
    process.env.DEEPSEEK_VISION_MODEL || 'deepseek-v4-flash-vision-exp',

  // AI 策略
  aiProvider: process.env.AI_PROVIDER || 'auto',
  aiTimeoutMs: parseInt(process.env.AI_TIMEOUT_MS || '30000', 10),
  aiMaxRetry: parseInt(process.env.AI_MAX_RETRY || '1', 10),

  // 上传/图片
  maxImageSizeMb: parseInt(process.env.MAX_IMAGE_SIZE_MB || '10', 10),
  imageMaxEdge: parseInt(process.env.IMAGE_MAX_EDGE || '800', 10),
  uploadDir: process.env.UPLOAD_DIR || './uploads',

  // 数据库
  dbPath: process.env.DB_PATH || './data/skin_care.db',

  // 跨域
  corsOrigins: toArray(process.env.CORS_ORIGINS, [
    'http://localhost:5173',
    'http://localhost:8080',
  ]),
};

/**
 * 校验关键配置：JWT_SECRET 缺失时启动报错
 */
function validateConfig() {
  const missing = [];
  if (!config.jwtSecret || config.jwtSecret === 'change_me_in_production') {
    missing.push('JWT_SECRET（请勿使用默认占位值）');
  }
  if (missing.length > 0) {
    throw new Error(
      `[config] 缺少关键环境变量：${missing.join('、')}。请复制 .env.example 为 .env 并填写。`
    );
  }
  return config;
}

// 解析为绝对路径（供 database / upload 使用）
config.dbPathAbs = path.isAbsolute(config.dbPath)
  ? config.dbPath
  : path.resolve(__dirname, '../../', config.dbPath);
config.uploadDirAbs = path.isAbsolute(config.uploadDir)
  ? config.uploadDir
  : path.resolve(__dirname, '../../', config.uploadDir);

module.exports = { config, validateConfig, toArray };
