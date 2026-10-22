-- =============================================================
-- 肌肤养护管理系统 - 数据库建表脚本（SQLite，可平滑迁移 MySQL）
-- 约定：
--   1) 主键统一 id INTEGER PRIMARY KEY AUTOINCREMENT
--   2) 时间戳统一 TEXT 存 ISO 8601 UTC；created_at/updated_at 必备
--   3) 核心业务表设 deleted_at 软删除，查询默认过滤
--   4) JSON 字段以 TEXT 存 JSON 字符串
-- =============================================================

-- ① 小程序用户
CREATE TABLE IF NOT EXISTS wx_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  openid TEXT NOT NULL UNIQUE,
  nickname TEXT,
  avatar_url TEXT,
  gender TEXT DEFAULT 'unknown',
  birthday TEXT,
  phone TEXT,
  status INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_wx_users_status ON wx_users(status);

-- ② 后台用户（管理员/医生）
CREATE TABLE IF NOT EXISTS admin_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  real_name TEXT,
  status INTEGER DEFAULT 1,
  last_login_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

-- ③ 角色
CREATE TABLE IF NOT EXISTS roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  remark TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

-- ④ 权限（菜单/按钮/接口）
CREATE TABLE IF NOT EXISTS permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  code TEXT NOT NULL UNIQUE,
  name TEXT,
  type TEXT DEFAULT 'menu',
  parent_id INTEGER DEFAULT 0,
  route_path TEXT,
  component TEXT,
  icon TEXT,
  sort INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT
);

-- ⑤ 角色-权限关联
CREATE TABLE IF NOT EXISTS role_permissions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  role_id INTEGER NOT NULL,
  permission_id INTEGER NOT NULL,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
  FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_role_permission ON role_permissions(role_id, permission_id);

-- ⑥ 后台用户-角色关联
CREATE TABLE IF NOT EXISTS admin_user_roles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER NOT NULL,
  role_id INTEGER NOT NULL,
  FOREIGN KEY (admin_user_id) REFERENCES admin_users(id) ON DELETE CASCADE,
  FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_admin_user_role ON admin_user_roles(admin_user_id, role_id);

-- ⑦ 肌肤档案（1:1 用户）
CREATE TABLE IF NOT EXISTS skin_profiles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL UNIQUE,
  skin_type TEXT,
  sensitivity INTEGER DEFAULT 0,
  concerns TEXT,
  habits TEXT,
  photo_url TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE
);

-- ⑧ 检测记录
CREATE TABLE IF NOT EXISTS detect_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  image_url TEXT,
  engine TEXT,
  degraded INTEGER DEFAULT 0,
  skin_type TEXT,
  issues TEXT,
  risk_level TEXT,
  score INTEGER,
  dimensions TEXT,
  raw_report TEXT,
  report_text TEXT,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_detect_user ON detect_records(user_id);
CREATE INDEX IF NOT EXISTS idx_detect_created ON detect_records(created_at);

-- ⑨ 打卡记录
CREATE TABLE IF NOT EXISTS checkin_records (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  checkin_date TEXT,
  cleanse INTEGER DEFAULT 0,
  moisturize INTEGER DEFAULT 0,
  sunscreen INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_checkin_user_date ON checkin_records(user_id, checkin_date);

-- ⑩ 肌肤数据字典
CREATE TABLE IF NOT EXISTS skin_dict (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  dict_type TEXT,
  dict_code TEXT,
  dict_name TEXT,
  dict_value TEXT,
  parent_id INTEGER DEFAULT 0,
  sort INTEGER DEFAULT 0,
  status INTEGER DEFAULT 1,
  remark TEXT,
  created_at TEXT,
  updated_at TEXT
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_skin_dict ON skin_dict(dict_type, dict_code);

-- ⑪ 个性化方案
CREATE TABLE IF NOT EXISTS plans (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  detect_record_id INTEGER,
  title TEXT,
  routine_morning TEXT,
  routine_evening TEXT,
  ingredients TEXT,
  taboos TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE,
  FOREIGN KEY (detect_record_id) REFERENCES detect_records(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_plan_user ON plans(user_id);

-- ⑫ 科普文章
CREATE TABLE IF NOT EXISTS articles (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  cover_url TEXT,
  content TEXT,
  author TEXT,
  status INTEGER DEFAULT 1,
  view_count INTEGER DEFAULT 0,
  publish_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

-- ⑬ 护肤产品
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  image_url TEXT,
  brand TEXT,
  category TEXT,
  description TEXT,
  ingredients TEXT,
  status INTEGER DEFAULT 1,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

-- ⑭ 公告
CREATE TABLE IF NOT EXISTS notices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  content TEXT,
  status INTEGER DEFAULT 1,
  publish_at TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT
);

-- ⑮ 文章收藏
CREATE TABLE IF NOT EXISTS favorites (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  article_id INTEGER NOT NULL,
  created_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE,
  FOREIGN KEY (article_id) REFERENCES articles(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_favorite ON favorites(user_id, article_id);

-- ⑯ 用户反馈
CREATE TABLE IF NOT EXISTS feedbacks (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  content TEXT NOT NULL,
  reply TEXT,
  status INTEGER DEFAULT 0,
  created_at TEXT,
  updated_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE
);

-- ⑰ 咨询预约
CREATE TABLE IF NOT EXISTS consultations (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  subject TEXT,
  description TEXT,
  status TEXT DEFAULT 'pending',
  doctor_id INTEGER,
  reply TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- ⑱ 专业建议
CREATE TABLE IF NOT EXISTS advice (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  doctor_id INTEGER,
  detect_record_id INTEGER,
  content TEXT NOT NULL,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (user_id) REFERENCES wx_users(id) ON DELETE CASCADE,
  FOREIGN KEY (doctor_id) REFERENCES admin_users(id) ON DELETE SET NULL,
  FOREIGN KEY (detect_record_id) REFERENCES detect_records(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_advice_user ON advice(user_id);

-- ⑲ 建议模板
CREATE TABLE IF NOT EXISTS advice_templates (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  doctor_id INTEGER,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT,
  created_at TEXT,
  updated_at TEXT,
  deleted_at TEXT,
  FOREIGN KEY (doctor_id) REFERENCES admin_users(id) ON DELETE SET NULL
);

-- （P2 预留）操作日志
CREATE TABLE IF NOT EXISTS operation_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_user_id INTEGER,
  action TEXT,
  target TEXT,
  detail TEXT,
  ip TEXT,
  created_at TEXT
);
