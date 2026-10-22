'use strict';

/**
 * 登录编排服务（微信 / 后台）
 */
const wechat = require('../utils/wechat');
const jwt = require('../utils/jwt');
const bcrypt = require('../utils/bcrypt');
const wxUserRepo = require('../repositories/wxUserRepo');
const adminUserRepo = require('../repositories/adminUserRepo');
const rbacRepo = require('../repositories/rbacRepo');
const { BusinessError } = require('../middlewares/errorHandler');

/**
 * 微信登录：code → openid → 自动建档 → 签发 JWT
 */
async function wxLogin(code) {
  if (!code) throw new BusinessError(400, '缺少登录 code');
  let openid;
  try {
    const session = await wechat.code2session(code);
    openid = session.openid;
  } catch (e) {
    throw new BusinessError(401, `微信登录失败：${e.message}`);
  }

  let user = wxUserRepo.findByOpenid(openid);
  let isNew = false;
  if (!user) {
    wxUserRepo.insert({ openid, status: 1 });
    user = wxUserRepo.findByOpenid(openid);
    isNew = true;
  } else {
    wxUserRepo.touchLogin(user.id);
  }

  const token = jwt.signWx(user.id, user.openid);
  return {
    token,
    userInfo: {
      id: user.id,
      nickname: user.nickname,
      avatarUrl: user.avatar_url,
      gender: user.gender,
    },
    isNew,
  };
}

/**
 * 后台登录：账号密码 → 校验 → 签发 JWT
 */
function adminLogin(username, password) {
  if (!username || !password) throw new BusinessError(400, '请输入用户名和密码');
  const user = adminUserRepo.findByUsername(username);
  if (!user) throw new BusinessError(401, '用户名或密码错误');
  if (user.status !== 1) throw new BusinessError(403, '账号已被禁用，请联系管理员');
  if (!bcrypt.compare(password, user.password_hash)) {
    throw new BusinessError(401, '用户名或密码错误');
  }
  adminUserRepo.touchLogin(user.id);

  const roles = rbacRepo.getRoleCodesByUserId(user.id);
  const perms = rbacRepo.getPermCodesByUserId(user.id);
  const token = jwt.signAdmin(user.id, user.username, roles, perms);
  const refreshToken = jwt.signRefresh(user.id);

  return {
    token,
    refreshToken,
    user: { id: user.id, username: user.username, realName: user.real_name },
    roles,
    perms,
  };
}

/**
 * 后台当前用户 + 权限 + 菜单树
 */
function adminMe(userId) {
  const user = adminUserRepo.getById(userId);
  if (!user) throw new BusinessError(404, '用户不存在');
  const roles = rbacRepo.getUserRoles(userId).map((r) => ({ code: r.code, name: r.name }));
  const perms = rbacRepo.getPermCodesByUserId(userId);
  const menus = rbacRepo.getMenusByPermCodes(perms);
  return {
    user: { id: user.id, username: user.username, realName: user.real_name, status: user.status },
    roles,
    perms,
    menus,
  };
}

module.exports = { wxLogin, adminLogin, adminMe };
