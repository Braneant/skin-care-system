'use strict';

/**
 * 业务错误类（携带错误码）
 */
class BusinessError extends Error {
  constructor(code, msg, httpStatus) {
    super(msg || '业务错误');
    this.name = 'BusinessError';
    this.code = code;
    this.httpStatus = httpStatus;
  }
}

/**
 * 统一异常处理中间件
 * - BusinessError → 按 code 返回
 * - body-parser JSON 解析失败（entity.parse.failed）→ 400
 * - 其他异常 → 兜底 500
 */
// eslint-disable-next-line no-unused-vars
function errorHandler(err, req, res, next) {
  // 兜底：确保 res.fail 可用（理论上 responseMiddleware 已先于 body-parser 挂载）
  if (typeof res.fail !== 'function') {
    // eslint-disable-next-line no-console
    console.error('[errorHandler]', err);
    return res
      .status(err && err.status ? err.status : 500)
      .json({ code: err && err.status ? err.status : 500, msg: '服务器内部错误', data: null });
  }

  if (err instanceof BusinessError) {
    return res.fail(err.code, err.message, err.httpStatus);
  }

  // body-parser 解析失败（非法 JSON / 超大请求体）
  if (err && (err.type === 'entity.parse.failed' || err.type === 'entity.too.large')) {
    return res.fail(400, '请求体格式非法（JSON 解析失败）', 400);
  }

  // multer 文件过大等错误
  if (err && (err.code === 'LIMIT_FILE_SIZE' || err.name === 'MulterError')) {
    return res.fail(20001, '图片过大或格式异常');
  }

  // eslint-disable-next-line no-console
  console.error('[errorHandler]', err);
  return res.fail(500, err.message || '服务器内部错误');
}

module.exports = { errorHandler, BusinessError };
