'use strict';

/**
 * Express 应用装配：中间件、静态资源、路由、错误处理
 */
const path = require('path');
const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const { config } = require('./config');
const responseMiddleware = require('./middlewares/response');
const { errorHandler } = require('./middlewares/errorHandler');
const routes = require('./routes');

const app = express();

// 请求日志
app.use(morgan('dev'));

// CORS 白名单
app.use(
  cors({
    origin(origin, cb) {
      if (!origin || config.corsOrigins.includes(origin)) return cb(null, true);
      return cb(null, false);
    },
    credentials: true,
  })
);

// 统一响应封装（必须在 express.json 之前，保证 res.ok/res.fail 在 body-parser 抛错时也可用）
app.use(responseMiddleware);

// 解析 JSON（放宽限制以支持 base64 图片）
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// 健康检查
app.get('/api/health', (req, res) => {
  res.ok({ status: 'ok', time: new Date().toISOString() });
});

// 静态资源（上传图片）
app.use('/uploads', express.static(path.join(config.uploadDirAbs)));

// 业务路由
app.use('/api', routes);

// 404
app.use((req, res) => {
  res.fail(404, `接口不存在：${req.method} ${req.originalUrl}`);
});

// 统一异常处理
app.use(errorHandler);

module.exports = app;
