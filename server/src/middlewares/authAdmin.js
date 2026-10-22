'use strict';

/**
 * 后台用户鉴权：校验请求头 Authorization: Bearer <token>
 * token 签发自 admin_users，type 必须为 'admin'。
 */
const { verify } = require('../utils/jwt');
const { extractBearer } = require('./authWx');

function authAdmin(req, res, next) {
  const header = req.headers['authorization'] || req.headers['Authorization'];
  const token = extractBearer(header);
  if (!token) {
    return res.fail(401, '未登录或登录已过期');
  }
  const payload = verify(token);
  if (!payload || payload.type !== 'admin') {
    return res.fail(401, '未登录或登录已过期');
  }
  req.admin = {
    id: payload.sub,
    username: payload.username,
    roles: payload.roles || [],
    perms: payload.perms || [],
  };
  next();
}

module.exports = { authAdmin };
