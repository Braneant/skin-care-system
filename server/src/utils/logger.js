'use strict';

/**
 * 简易日志：仅控制台输出（生产可扩展为文件/winston）
 */
const LEVELS = ['debug', 'info', 'warn', 'error'];

function log(level, ...args) {
  // eslint-disable-next-line no-console
  console[level](
    `[${new Date().toISOString()}] [${level.toUpperCase()}]`,
    ...args
  );
}

module.exports = {
  debug: (...a) => log('debug', ...a),
  info: (...a) => log('info', ...a),
  warn: (...a) => log('warn', ...a),
  error: (...a) => log('error', ...a),
  LEVELS,
};
