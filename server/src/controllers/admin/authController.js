'use strict';

const authService = require('../../services/authService');
const jwt = require('../../utils/jwt');
const adminUserRepo = require('../../repositories/adminUserRepo');
const rbacRepo = require('../../repositories/rbacRepo');

/** 后台登录 */
function login(req, res, next) {
  try {
    const { username, password } = req.body || {};
    const data = authService.adminLogin(username, password);
    return res.ok(data);
  } catch (e) {
    return next(e);
  }
}

/** 刷新 token */
function refresh(req, res, next) {
  try {
    const { refreshToken } = req.body || {};
    if (!refreshToken) return res.fail(401, '缺少 refreshToken');
    const payload = jwt.verify(refreshToken);
    if (!payload || payload.type !== 'admin') return res.fail(401, 'refreshToken 无效或过期');
    const user = adminUserRepo.getById(payload.sub);
    if (!user || user.status !== 1) return res.fail(401, '账号不可用');
    const roles = rbacRepo.getRoleCodesByUserId(user.id);
    const perms = rbacRepo.getPermCodesByUserId(user.id);
    const token = jwt.signAdmin(user.id, user.username, roles, perms);
    const newRefreshToken = jwt.signRefresh(user.id);
    return res.ok({ token, refreshToken: newRefreshToken });
  } catch (e) {
    return next(e);
  }
}

/** 当前用户 + 角色 + 权限 + 菜单树 */
function me(req, res, next) {
  try {
    return res.ok(authService.adminMe(req.admin.id));
  } catch (e) {
    return next(e);
  }
}

module.exports = { login, refresh, me };
