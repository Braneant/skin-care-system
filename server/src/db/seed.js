'use strict';

/**
 * 种子数据播种（幂等：依赖唯一约束 + INSERT OR IGNORE）
 * - 角色 admin / doctor
 * - 权限树（§9.6 权限码清单）
 * - 默认账号 admin / doctor（bcrypt 哈希，密码均为 admin123 / doctor123）
 * - 基础 skin_dict 字典
 * - 示例文章 / 产品 / 公告 / 演示用户
 */
const bcrypt = require('bcryptjs');

const now = () => new Date().toISOString();

/**
 * 权限树定义（parent 为父节点 code 或 null）
 */
const PERMISSIONS = [
  // 数据看板
  { code: 'dashboard:view', name: '数据看板', type: 'menu', parent: null, route: '/dashboard', component: 'dashboard/index', icon: 'Odometer', sort: 1 },
  // 系统管理
  { code: 'system', name: '系统管理', type: 'menu', parent: null, route: '/system', component: null, icon: 'Setting', sort: 2 },
  { code: 'system:user:list', name: '用户管理', type: 'menu', parent: 'system', route: '/users', component: 'users/index', icon: 'User', sort: 1 },
  { code: 'system:user:add', name: '新增用户', type: 'button', parent: 'system:user:list', sort: 1 },
  { code: 'system:user:edit', name: '编辑用户', type: 'button', parent: 'system:user:list', sort: 2 },
  { code: 'system:user:status', name: '启停用户', type: 'button', parent: 'system:user:list', sort: 3 },
  { code: 'system:role:list', name: '角色权限', type: 'menu', parent: 'system', route: '/rbac', component: 'rbac/index', icon: 'Lock', sort: 2 },
  { code: 'system:role:add', name: '新增角色', type: 'button', parent: 'system:role:list', sort: 1 },
  { code: 'system:role:edit', name: '编辑角色', type: 'button', parent: 'system:role:list', sort: 2 },
  { code: 'system:role:delete', name: '删除角色', type: 'button', parent: 'system:role:list', sort: 3 },
  // 内容运营
  { code: 'content', name: '内容运营', type: 'menu', parent: null, route: '/content', component: null, icon: 'Document', sort: 3 },
  { code: 'content:article:list', name: '文章管理', type: 'menu', parent: 'content', route: '/content/article', component: 'content/article', icon: 'Tickets', sort: 1 },
  { code: 'content:article:add', name: '新增文章', type: 'button', parent: 'content:article:list', sort: 1 },
  { code: 'content:article:edit', name: '编辑文章', type: 'button', parent: 'content:article:list', sort: 2 },
  { code: 'content:article:delete', name: '删除文章', type: 'button', parent: 'content:article:list', sort: 3 },
  { code: 'content:product:list', name: '产品管理', type: 'menu', parent: 'content', route: '/content/product', component: 'content/product', icon: 'Goods', sort: 2 },
  { code: 'content:product:add', name: '新增产品', type: 'button', parent: 'content:product:list', sort: 1 },
  { code: 'content:product:edit', name: '编辑产品', type: 'button', parent: 'content:product:list', sort: 2 },
  { code: 'content:product:delete', name: '删除产品', type: 'button', parent: 'content:product:list', sort: 3 },
  { code: 'content:notice:list', name: '公告管理', type: 'menu', parent: 'content', route: '/content/notice', component: 'content/notice', icon: 'Bell', sort: 3 },
  { code: 'content:notice:add', name: '新增公告', type: 'button', parent: 'content:notice:list', sort: 1 },
  { code: 'content:notice:edit', name: '编辑公告', type: 'button', parent: 'content:notice:list', sort: 2 },
  { code: 'content:notice:delete', name: '删除公告', type: 'button', parent: 'content:notice:list', sort: 3 },
  // 肌肤字典
  { code: 'skin:dict:list', name: '肌肤数据', type: 'menu', parent: null, route: '/skin-dict', component: 'skin-dict/index', icon: 'Collection', sort: 4 },
  { code: 'skin:dict:add', name: '新增字典', type: 'button', parent: 'skin:dict:list', sort: 1 },
  { code: 'skin:dict:edit', name: '编辑字典', type: 'button', parent: 'skin:dict:list', sort: 2 },
  { code: 'skin:dict:delete', name: '删除字典', type: 'button', parent: 'skin:dict:list', sort: 3 },
  // 反馈
  { code: 'feedback:list', name: '反馈管理', type: 'menu', parent: null, route: '/feedback', component: 'feedback/index', icon: 'ChatDotSquare', sort: 5 },
  { code: 'feedback:reply', name: '回复反馈', type: 'button', parent: 'feedback:list', sort: 1 },
  // 检测记录
  { code: 'detect:record:list', name: '检测记录', type: 'menu', parent: null, route: '/detect-records', component: 'detect-records/index', icon: 'Camera', sort: 6 },
  // 医生工作台
  { code: 'doctor', name: '医生工作台', type: 'menu', parent: null, route: '/doctor', component: null, icon: 'FirstAidKit', sort: 7 },
  { code: 'doctor:patient:view', name: '工作台首页', type: 'menu', parent: 'doctor', route: '/doctor', component: 'doctor/index', icon: 'UserFilled', sort: 1 },
  { code: 'doctor:consult:handle', name: '咨询预约', type: 'menu', parent: 'doctor', route: '/doctor/consultations', component: 'doctor/consultations', icon: 'ChatLineRound', sort: 2 },
  { code: 'doctor:advice:write', name: '撰写建议', type: 'button', parent: 'doctor', sort: 3 },
];

/** 角色与权限码映射 */
const ROLE_PERMS = {
  admin: PERMISSIONS.map((p) => p.code),
  doctor: [
    'dashboard:view',
    'doctor',
    'doctor:patient:view',
    'doctor:advice:write',
    'doctor:consult:handle',
    'system',
    'system:user:list',
    'detect:record:list',
  ],
};

/** 默认账号 */
const DEFAULT_ADMINS = [
  { username: 'admin', password: 'admin123', real_name: '系统管理员', role: 'admin' },
  { username: 'doctor', password: 'doctor123', real_name: '皮肤科医生', role: 'doctor' },
];

/** 基础肌肤字典 */
const SKIN_DICT = [
  { dict_type: 'skin_type', dict_code: 'dry', dict_name: '干性', sort: 1 },
  { dict_type: 'skin_type', dict_code: 'oily', dict_name: '油性', sort: 2 },
  { dict_type: 'skin_type', dict_code: 'combination', dict_name: '混合性', sort: 3 },
  { dict_type: 'skin_type', dict_code: 'normal', dict_name: '中性', sort: 4 },
  { dict_type: 'skin_type', dict_code: 'sensitive', dict_name: '敏感性', sort: 5 },
  { dict_type: 'issue', dict_code: 'acne', dict_name: '痘痘', sort: 1 },
  { dict_type: 'issue', dict_code: 'blackhead', dict_name: '黑头', sort: 2 },
  { dict_type: 'issue', dict_code: 'wrinkle', dict_name: '皱纹', sort: 3 },
  { dict_type: 'issue', dict_code: 'spot', dict_name: '色斑', sort: 4 },
  { dict_type: 'issue', dict_code: 'pore', dict_name: '毛孔', sort: 5 },
  { dict_type: 'issue', dict_code: 'sensitivity', dict_name: '敏感', sort: 6 },
  { dict_type: 'issue', dict_code: 'dull', dict_name: '暗沉', sort: 7 },
  { dict_type: 'risk', dict_code: 'good', dict_name: '良好', sort: 1 },
  { dict_type: 'risk', dict_code: 'normal', dict_name: '一般', sort: 2 },
  { dict_type: 'risk', dict_code: 'attention', dict_name: '需关注', sort: 3 },
  { dict_type: 'risk', dict_code: 'high', dict_name: '高风险', sort: 4 },
  { dict_type: 'ingredient', dict_code: 'ceramide', dict_name: '神经酰胺', sort: 1 },
  { dict_type: 'ingredient', dict_code: 'niacinamide', dict_name: '烟酰胺', sort: 2 },
  { dict_type: 'ingredient', dict_code: 'hyaluronic', dict_name: '透明质酸', sort: 3 },
  { dict_type: 'ingredient', dict_code: 'salicylic', dict_name: '水杨酸', sort: 4 },
  { dict_type: 'ingredient', dict_code: 'vitamin_c', dict_name: '维生素C', sort: 5 },
  { dict_type: 'ingredient', dict_code: 'retinol', dict_name: '视黄醇', sort: 6 },
];

/**
 * 播种主函数
 * @param {import('better-sqlite3').Database} db
 */
function seed(db) {
  seedRoles(db);
  seedPermissions(db);
  seedAdminUsers(db);
  seedRolePermissions(db);
  seedSkinDict(db);
  seedContent(db);
  seedDemoUser(db);
}

function seedRoles(db) {
  const stmt = db.prepare(
    'INSERT OR IGNORE INTO roles (code, name, remark, status, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
  );
  const t = now();
  stmt.run('admin', '系统管理员', '拥有全部权限', 1, t, t);
  stmt.run('doctor', '医生/医护顾问', '医生工作台权限', 1, t, t);
}

function seedPermissions(db) {
  const insPerm = db.prepare(
    `INSERT OR IGNORE INTO permissions
     (code, name, type, parent_id, route_path, component, icon, sort, created_at, updated_at)
     VALUES (@code, @name, @type, @parent_id, @route_path, @component, @icon, @sort, @created_at, @updated_at)`
  );
  const getPerm = db.prepare('SELECT id FROM permissions WHERE code = ?');
  const t = now();

  for (const p of PERMISSIONS) {
    const parentId = p.parent ? getPerm.get(p.parent)?.id || 0 : 0;
    insPerm.run({
      code: p.code,
      name: p.name,
      type: p.type,
      parent_id: parentId,
      route_path: p.route || null,
      component: p.component || null,
      icon: p.icon || null,
      sort: p.sort || 0,
      created_at: t,
      updated_at: t,
    });
  }
}

function seedAdminUsers(db) {
  const insUser = db.prepare(
    `INSERT OR IGNORE INTO admin_users
     (username, password_hash, real_name, status, created_at, updated_at)
     VALUES (?, ?, ?, 1, ?, ?)`
  );
  const getUser = db.prepare('SELECT id FROM admin_users WHERE username = ?');
  const getRole = db.prepare('SELECT id FROM roles WHERE code = ?');
  const insUserRole = db.prepare(
    'INSERT OR IGNORE INTO admin_user_roles (admin_user_id, role_id) VALUES (?, ?)'
  );
  const t = now();

  for (const a of DEFAULT_ADMINS) {
    const hash = bcrypt.hashSync(a.password, 10);
    insUser.run(a.username, hash, a.real_name, t, t);
    const user = getUser.get(a.username);
    const role = getRole.get(a.role);
    if (user && role) insUserRole.run(user.id, role.id);
  }
}

function seedRolePermissions(db) {
  const getRole = db.prepare('SELECT id FROM roles WHERE code = ?');
  const getPerm = db.prepare('SELECT id FROM permissions WHERE code = ?');
  const ins = db.prepare(
    'INSERT OR IGNORE INTO role_permissions (role_id, permission_id) VALUES (?, ?)'
  );
  for (const [roleCode, permCodes] of Object.entries(ROLE_PERMS)) {
    const role = getRole.get(roleCode);
    if (!role) continue;
    for (const code of permCodes) {
      const perm = getPerm.get(code);
      if (perm) ins.run(role.id, perm.id);
    }
  }
}

function seedSkinDict(db) {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO skin_dict
     (dict_type, dict_code, dict_name, dict_value, parent_id, sort, status, created_at, updated_at)
     VALUES (?, ?, ?, ?, 0, ?, 1, ?, ?)`
  );
  const t = now();
  for (const d of SKIN_DICT) {
    stmt.run(d.dict_type, d.dict_code, d.dict_name, '{}', d.sort || 0, t, t);
  }
}

function seedContent(db) {
  const t = now();
  // 示例文章
  const articleCount = db.prepare('SELECT COUNT(*) AS c FROM articles').get().c;
  if (articleCount === 0) {
    db.prepare(
      `INSERT INTO articles (title, cover_url, content, author, status, view_count, publish_at, created_at, updated_at)
       VALUES (?, ?, ?, ?, 1, 0, ?, ?, ?)`
    ).run(
      '科学护肤：如何正确认识自己的肤质',
      null,
      '<h3>认识肤质</h3><p>肤质通常分为干性、油性、混合性、中性、敏感性五类。建议通过问卷与专业检测了解自己的肤质。</p><h3>基础三步</h3><p>清洁、保湿、防晒是日常护肤的基础，坚持做好三步即可改善大多数肌肤问题。</p>',
      '平台小编',
      t,
      t,
      t
    );
  }

  // 示例产品
  const productCount = db.prepare('SELECT COUNT(*) AS c FROM products').get().c;
  if (productCount === 0) {
    db.prepare(
      `INSERT INTO products (name, image_url, brand, category, description, ingredients, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, 1, ?, ?)`
    ).run(
      '神经酰胺修护保湿霜',
      null,
      '示例品牌',
      '保湿修护',
      '适合干性、敏感性肌肤，帮助修护皮肤屏障。',
      JSON.stringify(['神经酰胺', '透明质酸', '甘油']),
      t,
      t
    );
  }

  // 示例公告
  const noticeCount = db.prepare('SELECT COUNT(*) AS c FROM notices').get().c;
  if (noticeCount === 0) {
    db.prepare(
      `INSERT INTO notices (title, content, status, publish_at, created_at, updated_at)
       VALUES (?, ?, 1, ?, ?, ?)`
    ).run('系统上线公告', '智能护肤小程序正式上线，欢迎体验 AI 测肤与个性化护肤方案。', t, t, t);
  }
}

function seedDemoUser(db) {
  const stmt = db.prepare(
    `INSERT OR IGNORE INTO wx_users
     (openid, nickname, avatar_url, gender, status, last_login_at, created_at, updated_at)
     VALUES (?, ?, ?, 'unknown', 1, NULL, ?, ?)`
  );
  const t = now();
  stmt.run('dev_demo_openid', '演示用户', null, t, t);
}

module.exports = { seed, PERMISSIONS, ROLE_PERMS };
