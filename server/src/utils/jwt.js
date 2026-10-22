'use strict';

/**
 * JWT 签发/校验
 * - wx 用户：{ sub, type: 'wx', openid }
 * - 后台用户：{ sub, type: 'admin', username, roles, perms }
 */
const jwt = require('jsonwebtoken');
const { config } = require('../config');

function sign(payload, expiresIn) {
  return jwt.sign(payload, config.jwtSecret, {
    expiresIn: expiresIn || config.jwtExpiresIn,
  });
}

/** 小程序用户 token */
function signWx(userId, openid) {
  return sign({ sub: userId, type: 'wx', openid }, config.jwtExpiresIn);
}

/** 后台用户 token */
function signAdmin(userId, username, roles = [], perms = []) {
  return sign(
    { sub: userId, type: 'admin', username, roles, perms },
    config.jwtExpiresIn
  );
}

/** 后台刷新 token */
function signRefresh(userId) {
  return sign({ sub: userId, type: 'admin' }, config.jwtRefreshExpiresIn);
}

/** 校验 token，返回 payload；失败返回 null */
function verify(token) {
  try {
    return jwt.verify(token, config.jwtSecret);
  } catch (e) {
    return null;
  }
}

module.exports = { sign, signWx, signAdmin, signRefresh, verify };
