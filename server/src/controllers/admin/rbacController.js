'use strict';

const rbacRepo = require('../../repositories/rbacRepo');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 角色列表 */
function listRoles(req, res, next) {
  try {
    const roles = rbacRepo.listRoles();
    return res.ok(
      roles.map((r) => ({
        id: r.id,
        code: r.code,
        name: r.name,
        remark: r.remark,
        status: r.status,
      }))
    );
  } catch (e) {
    return next(e);
  }
}

/** 新增角色 */
function createRole(req, res, next) {
  try {
    const { code, name, remark } = req.body || {};
    if (!code || !name) throw new BusinessError(400, '请填写角色编码与名称');
    if (rbacRepo.findRoleByCode(code)) throw new BusinessError(409, '角色编码已存在');
    const id = rbacRepo.createRole({ code: String(code).trim(), name, remark: remark || '' });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 编辑角色（含权限分配） */
function updateRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!rbacRepo.getRoleById(id)) throw new BusinessError(404, '角色不存在');
    const { name, remark, permissionIds } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = name;
    if (remark !== undefined) data.remark = remark;
    rbacRepo.updateRoleInfo(id, data);
    if (Array.isArray(permissionIds)) {
      rbacRepo.setRolePermissions(id, permissionIds.map(Number));
    }
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 删除角色 */
function deleteRole(req, res, next) {
  try {
    const id = Number(req.params.id);
    const role = rbacRepo.getRoleById(id);
    if (!role) throw new BusinessError(404, '角色不存在');
    if (role.code === 'admin' || role.code === 'doctor') {
      throw new BusinessError(400, '系统内置角色不可删除');
    }
    rbacRepo.deleteRole(id);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 权限树 */
function listPermissions(req, res, next) {
  try {
    return res.ok(rbacRepo.getPermissionTree());
  } catch (e) {
    return next(e);
  }
}

/** 角色详情（含已分配权限） */
function getRole(req, res, next) {
  try {
    const role = rbacRepo.getRoleById(Number(req.params.id));
    if (!role) throw new BusinessError(404, '角色不存在');
    return res.ok({
      id: role.id,
      code: role.code,
      name: role.name,
      remark: role.remark,
      permissionIds: rbacRepo.getRolePermissionIds(role.id),
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { listRoles, createRole, updateRole, deleteRole, listPermissions, getRole };
