'use strict';

/**
 * 数据访问层基类：封装 better-sqlite3 预编译语句通用助手
 * - 软删除表通过 softDelete=true 自动过滤 deleted_at
 * - created_at / updated_at 自动填充
 */
const helper = require('../utils/helper');

class BaseRepo {
  /**
   * @param {string} table 表名
   * @param {{softDelete?: boolean}} options
   */
  constructor(table, options = {}) {
    this.table = table;
    // 注意：不可命名为 softDelete，否则会遮蔽原型上的 softDelete(id) 方法
    this.softDeleteEnabled = !!options.softDelete;
    this._db = null;
  }

  get db() {
    if (!this._db) {
      // eslint-disable-next-line global-require
      this._db = require('../config/database').getDb();
    }
    return this._db;
  }

  prepare(sql) {
    return this.db.prepare(sql);
  }

  /** 表字段集合（缓存，用于过滤非法列并决定是否填充时间戳） */
  get columns() {
    if (!this._columns) {
      this._columns = new Set(
        this.db.prepare(`PRAGMA table_info(${this.table})`).all().map((c) => c.name)
      );
    }
    return this._columns;
  }

  /** 按 id 查询（软删除自动过滤） */
  getById(id) {
    let sql = `SELECT * FROM ${this.table} WHERE id = ?`;
    if (this.softDeleteEnabled) sql += ' AND deleted_at IS NULL';
    return this.prepare(sql).get(id);
  }

  /** 插入一行，返回自增 id */
  insert(data) {
    const t = helper.now();
    const payload = { ...data };
    if (this.columns.has('created_at') && payload.created_at === undefined) payload.created_at = t;
    if (this.columns.has('updated_at') && payload.updated_at === undefined) payload.updated_at = t;
    // 过滤掉表结构不存在的字段，避免 SQL 报错
    const keys = Object.keys(payload).filter((k) => this.columns.has(k));
    const cols = keys.join(', ');
    const placeholders = keys.map(() => '?').join(', ');
    const sql = `INSERT INTO ${this.table} (${cols}) VALUES (${placeholders})`;
    const info = this.prepare(sql).run(...keys.map((k) => payload[k]));
    return Number(info.lastInsertRowid);
  }

  /** 按 id 更新，返回 changes */
  updateById(id, data) {
    const payload = { ...data };
    delete payload.id;
    delete payload.created_at;
    if (this.columns.has('updated_at')) payload.updated_at = helper.now();
    // 过滤掉表结构不存在的字段
    const keys = Object.keys(payload).filter((k) => this.columns.has(k));
    if (keys.length === 0) return { changes: 0 };
    const setClause = keys.map((k) => `${k} = ?`).join(', ');
    const sql = `UPDATE ${this.table} SET ${setClause} WHERE id = ?`;
    return this.prepare(sql).run(...keys.map((k) => payload[k]), id);
  }

  /** 软删除 */
  softDelete(id) {
    return this.updateById(id, { deleted_at: helper.now() });
  }

  /** 物理删除 */
  hardDelete(id) {
    return this.prepare(`DELETE FROM ${this.table} WHERE id = ?`).run(id);
  }

  /**
   * 列表查询
   * @param {{where?: string, params?: Array, orderBy?: string, page?: number, pageSize?: number}} opts
   */
  list(opts = {}) {
    const { where = '', params = [], orderBy = 'id DESC', page, pageSize } = opts;
    let whereClause = where;
    if (this.softDeleteEnabled) {
      whereClause = where ? `(${where}) AND deleted_at IS NULL` : 'deleted_at IS NULL';
    }
    let sql = `SELECT * FROM ${this.table}`;
    if (whereClause) sql += ` WHERE ${whereClause}`;
    if (orderBy) sql += ` ORDER BY ${orderBy}`;
    const allParams = [...params];
    if (page && pageSize) {
      sql += ' LIMIT ? OFFSET ?';
      allParams.push(pageSize, (page - 1) * pageSize);
    }
    return this.prepare(sql).all(...allParams);
  }

  /** 计数 */
  count(opts = {}) {
    const { where = '', params = [] } = opts;
    let whereClause = where;
    if (this.softDeleteEnabled) {
      whereClause = where ? `(${where}) AND deleted_at IS NULL` : 'deleted_at IS NULL';
    }
    let sql = `SELECT COUNT(*) AS c FROM ${this.table}`;
    if (whereClause) sql += ` WHERE ${whereClause}`;
    return this.prepare(sql).get(...params).c;
  }

  /** 分页查询 */
  paginate(opts = {}) {
    const { page = 1, pageSize = 10, where = '', params = [], orderBy = 'id DESC' } = opts;
    const rows = this.list({ where, params, orderBy, page, pageSize });
    const total = this.count({ where, params });
    return { list: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 0 };
  }
}

module.exports = BaseRepo;
