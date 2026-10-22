'use strict';

/**
 * RBAC 接口级鉴权：requirePermission('code')
 * 依据 req.admin.perms 判定，无权限返回 403。
 */
function requirePermission(code) {
  return function (req, res, next) {
    const perms = (req.admin && req.admin.perms) || [];
    // 拥有通配符 admin 全量权限（permission code 精确匹配，不做通配）
    if (!perms.includes(code)) {
      return res.fail(403, '无权限访问该资源');
    }
    next();
  };
}

module.exports = requirePermission;
