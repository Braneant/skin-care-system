'use strict';

/**
 * 小程序用户鉴权：校验请求头 Wx-Authorization: Bearer <token>
 * token 签发自 wx_users，type 必须为 'wx'。
 */
const { verify } = require('../utils/jwt');

function authWx(req, res, next) {
  const header = req.headers['wx-authorization'] || req.headers['Wx-Authorization'];
  const token = extractBearer(header);
  if (!token) {
    return res.fail(401, '未登录或登录已过期');
  }
  const payload = verify(token);
  if (!payload || payload.type !== 'wx') {
    return res.fail(401, '未登录或登录已过期');
  }
  req.user = { id: payload.sub, openid: payload.openid };
  next();
}

function extractBearer(header) {
  if (!header) return null;
  if (header.startsWith('Bearer ')) return header.slice(7);
  return header;
}

module.exports = { authWx, extractBearer };
