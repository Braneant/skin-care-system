'use strict';

/**
 * RBAC 数据访问：roles / permissions / role_permissions / admin_user_roles
 */
const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class RbacRepo extends BaseRepo {
  constructor() {
    super('roles', { softDelete: true });
  }

  // ============ 用户侧查询 ============

  /** 用户角色 code 列表 */
  getRoleCodesByUserId(userId) {
    return this.prepare(
      `SELECT r.code FROM roles r
       JOIN admin_user_roles ur ON ur.role_id = r.id
       WHERE ur.admin_user_id = ? AND r.deleted_at IS NULL AND r.status = 1`
    ).all(userId).map((r) => r.code);
  }

  /** 用户权限 code 列表（去重） */
  getPermCodesByUserId(userId) {
    const rows = this.prepare(
      `SELECT DISTINCT p.code FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN admin_user_roles ur ON ur.role_id = rp.role_id
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.admin_user_id = ? AND r.deleted_at IS NULL AND r.status = 1`
    ).all(userId);
    return rows.map((r) => r.code);
  }

  /** 用户角色详情 */
  getUserRoles(userId) {
    return this.prepare(
      `SELECT r.id, r.code, r.name FROM roles r
       JOIN admin_user_roles ur ON ur.role_id = r.id
       WHERE ur.admin_user_id = ? AND r.deleted_at IS NULL`
    ).all(userId);
  }

  /** 用户权限详情 */
  getUserPermissions(userId) {
    return this.prepare(
      `SELECT DISTINCT p.id, p.code, p.name, p.type FROM permissions p
       JOIN role_permissions rp ON rp.permission_id = p.id
       JOIN admin_user_roles ur ON ur.role_id = rp.role_id
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.admin_user_id = ? AND r.deleted_at IS NULL AND r.status = 1
       ORDER BY p.sort ASC, p.id ASC`
    ).all(userId);
  }

  /**
   * 根据权限码集合构建菜单树（type=menu，含可见祖先容器）
   * @param {string[]} permCodes
   */
  getMenusByPermCodes(permCodes) {
    const permSet = new Set(permCodes || []);
    const menus = this.prepare(
      'SELECT * FROM permissions WHERE type = ? ORDER BY sort ASC, id ASC'
    ).all('menu');

    const byId = new Map(menus.map((m) => [m.id, { ...m, children: [] }]));
    const vis = new Map();

    const isVisible = (id) => {
      if (vis.has(id)) return vis.get(id);
      const node = byId.get(id);
      let v = permSet.has(node.code);
      for (const child of menus.filter((m) => m.parent_id === id)) {
        if (isVisible(child.id)) v = true;
      }
      vis.set(id, v);
      return v;
    };
    menus.forEach((m) => isVisible(m.id));

    const build = (id) => {
      const node = byId.get(id);
      if (!vis.get(id)) return null;
      const children = menus
        .filter((m) => m.parent_id === id)
        .map((m) => build(m.id))
        .filter(Boolean);
      return {
        id: node.id,
        code: node.code,
        name: node.name,
        type: node.type,
        parentId: node.parent_id,
        routePath: node.route_path,
        component: node.component,
        icon: node.icon,
        sort: node.sort,
        children,
      };
    };

    return menus
      .filter((m) => m.parent_id === 0)
      .map((m) => build(m.id))
      .filter(Boolean);
  }

  // ============ 角色管理 ============

  listRoles() {
    return this.list({ where: '1=1', orderBy: 'id ASC' });
  }

  getRoleById(id) {
    return this.getById(id);
  }

  findRoleByCode(code) {
    return this.prepare(
      'SELECT * FROM roles WHERE code = ? AND deleted_at IS NULL'
    ).get(code);
  }

  createRole({ code, name, remark = '' }) {
    return this.insert({ code, name, remark, status: 1 });
  }

  updateRoleInfo(id, { name, remark }) {
    return this.updateById(id, { name, remark });
  }

  deleteRole(id) {
    this.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(id);
    this.prepare('DELETE FROM admin_user_roles WHERE role_id = ?').run(id);
    return this.softDelete(id);
  }

  /** 角色已分配的权限 id */
  getRolePermissionIds(roleId) {
    return this.prepare(
      'SELECT permission_id FROM role_permissions WHERE role_id = ?'
    ).all(roleId).map((r) => r.permission_id);
  }

  /** 替换角色权限 */
  setRolePermissions(roleId, permissionIds) {
    const tx = this.db.transaction((ids) => {
      this.prepare('DELETE FROM role_permissions WHERE role_id = ?').run(roleId);
      const ins = this.prepare(
        'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
      );
      for (const pid of ids) ins.run(roleId, pid);
    });
    tx(permissionIds || []);
  }

  // ============ 权限管理 ============

  /** 全部权限（扁平，camelCase） */
  listAllPermissions() {
    return this.prepare(
      'SELECT * FROM permissions ORDER BY sort ASC, id ASC'
    ).all().map(this.toCamel);
  }

  /** 权限树 */
  getPermissionTree() {
    const all = this.listAllPermissions();
    const byId = new Map(all.map((p) => [p.id, { ...p, children: [] }]));
    const roots = [];
    for (const p of all) {
      if (p.parentId && byId.has(p.parentId)) {
        byId.get(p.parentId).children.push(byId.get(p.id));
      } else {
        roots.push(byId.get(p.id));
      }
    }
    return roots;
  }

  toCamel(row) {
    return {
      id: row.id,
      code: row.code,
      name: row.name,
      type: row.type,
      parentId: row.parent_id,
      routePath: row.route_path,
      component: row.component,
      icon: row.icon,
      sort: row.sort,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  // ============ 用户-角色关联 ============

  getUserRoleIds(userId) {
    return this.prepare(
      'SELECT role_id FROM admin_user_roles WHERE admin_user_id = ?'
    ).all(userId).map((r) => r.role_id);
  }

  setUserRoles(userId, roleIds) {
    const tx = this.db.transaction((ids) => {
      this.prepare('DELETE FROM admin_user_roles WHERE admin_user_id = ?').run(userId);
      const ins = this.prepare(
        'INSERT OR IGNORE INTO admin_user_roles (admin_user_id, role_id) VALUES (?, ?)'
      );
      for (const rid of ids) ins.run(userId, rid);
    });
    tx(roleIds || []);
  }
}

module.exports = new RbacRepo();
