'use strict';

/**
 * 统一响应封装：res.ok(data) / res.fail(code, msg)
 * 控制器内禁止直接 res.json，统一走本封装。
 */
function responseMiddleware(req, res, next) {
  /** 成功响应 */
  res.ok = function ok(data = null, msg = 'success') {
    return res.status(200).json({ code: 0, msg, data });
  };

  /** 失败响应 */
  res.fail = function fail(code = 500, msg = '服务器内部错误', httpStatus) {
    const status = httpStatus || (code >= 100 && code < 600 ? code : 500);
    // 业务错误码（>=10000）统一 HTTP 200 承载，避免前端把业务失败当网络错误
    const http = code >= 10000 ? 200 : status;
    return res.status(http).json({ code, msg, data: null });
  };

  next();
}

module.exports = responseMiddleware;
