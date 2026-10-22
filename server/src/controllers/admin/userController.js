'use strict';

const wxUserRepo = require('../../repositories/wxUserRepo');
const adminUserRepo = require('../../repositories/adminUserRepo');
const rbacRepo = require('../../repositories/rbacRepo');
const bcrypt = require('../../utils/bcrypt');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 用户列表：type=wx 普通用户 / type=admin 顾问账号 */
function list(req, res, next) {
  try {
    const type = req.query.type || 'wx';
    const { page, pageSize } = helper.pageParams(req.query);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';

    if (type === 'admin') {
      const where = keyword ? 'username LIKE ? OR real_name LIKE ?' : '1=1';
      const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];
      const result = adminUserRepo.paginate({ page, pageSize, where, params, orderBy: 'id DESC' });
      const list = result.list.map((u) => ({
        id: u.id,
        username: u.username,
        realName: u.real_name,
        status: u.status,
        roles: rbacRepo.getUserRoles(u.id).map((r) => r.code),
        lastLoginAt: u.last_login_at,
        createdAt: u.created_at,
      }));
      return res.ok({ list, total: result.total, page, pageSize, totalPages: result.totalPages });
    }

    const where = keyword ? 'nickname LIKE ? OR phone LIKE ?' : '1=1';
    const params = keyword ? [`%${keyword}%`, `%${keyword}%`] : [];
    const result = wxUserRepo.paginate({ page, pageSize, where, params, orderBy: 'id DESC' });
    const list = result.list.map((u) => ({
      id: u.id,
      nickname: u.nickname,
      avatarUrl: u.avatar_url,
      gender: u.gender,
      phone: u.phone,
      status: u.status,
      lastLoginAt: u.last_login_at,
      createdAt: u.created_at,
    }));
    return res.ok({ list, total: result.total, page, pageSize, totalPages: result.totalPages });
  } catch (e) {
    return next(e);
  }
}

/** 新增（顾问账号） */
function create(req, res, next) {
  try {
    const { username, password, realName, roleIds } = req.body || {};
    if (!username || !password) throw new BusinessError(400, '请输入用户名和密码');
    if (adminUserRepo.findByUsername(username)) throw new BusinessError(409, '用户名已存在');
    const id = adminUserRepo.insert({
      username: String(username).trim(),
      password_hash: bcrypt.hash(password),
      real_name: realName || '',
      status: 1,
    });
    if (Array.isArray(roleIds) && roleIds.length) rbacRepo.setUserRoles(id, roleIds);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 编辑用户/顾问 */
function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    const type = req.body.type || 'admin';
    if (type === 'admin') {
      const { realName, roleIds, password } = req.body || {};
      const data = {};
      if (realName !== undefined) data.real_name = realName;
      if (password) data.password_hash = bcrypt.hash(password);
      adminUserRepo.updateById(id, data);
      if (Array.isArray(roleIds)) rbacRepo.setUserRoles(id, roleIds);
      return res.ok({ id });
    }
    const { nickname, status } = req.body || {};
    const data = {};
    if (nickname !== undefined) data.nickname = String(nickname).slice(0, 64);
    if (status !== undefined) data.status = status ? 1 : 0;
    wxUserRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 启停用户/顾问 */
function updateStatus(req, res, next) {
  try {
    const id = Number(req.params.id);
    const type = req.query.type || req.body.type || 'wx';
    const status = req.body.status ? 1 : 0;
    if (type === 'admin') adminUserRepo.updateById(id, { status });
    else wxUserRepo.updateById(id, { status });
    return res.ok({ id, status });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, update, updateStatus };
