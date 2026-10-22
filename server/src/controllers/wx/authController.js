'use strict';

const authService = require('../../services/authService');

/**
 * 微信登录：POST /api/wx/auth/login
 */
async function login(req, res, next) {
  try {
    const { code } = req.body || {};
    const data = await authService.wxLogin(code);
    return res.ok(data);
  } catch (e) {
    return next(e);
  }
}

module.exports = { login };
