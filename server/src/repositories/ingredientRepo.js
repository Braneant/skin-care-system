'use strict';

const BaseRepo = require('./baseRepo');

class IngredientRepo extends BaseRepo {
  constructor() {
    super('ingredients', { softDelete: true });
  }

  findByName(name) {
    return this.prepare(
      'SELECT * FROM ingredients WHERE name = ? AND deleted_at IS NULL'
    ).get(name);
  }

  /** 成分检索（name / aliases / functions），分页 */
  search(keyword = '', page = 1, pageSize = 20) {
    const conditions = ['status = 1'];
    const params = [];
    if (keyword) {
      conditions.push('(name LIKE ? OR aliases LIKE ? OR functions LIKE ? OR en_name LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like, like);
    }
    const where = conditions.join(' AND ');
    const rows = this.prepare(
      `SELECT * FROM ingredients WHERE ${where} ORDER BY id ASC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, (page - 1) * pageSize);
    const total = this.prepare(
      `SELECT COUNT(*) AS c FROM ingredients WHERE ${where}`
    ).get(...params).c;
    return { list: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 0 };
  }

  /** 管理端列表（含停用，分页 + 关键字） */
  adminList(page = 1, pageSize = 10, keyword = '') {
    const conditions = ['1=1'];
    const params = [];
    if (keyword) {
      conditions.push('(name LIKE ? OR en_name LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like);
    }
    const where = conditions.join(' AND ');
    const rows = this.prepare(
      `SELECT * FROM ingredients WHERE ${where} AND deleted_at IS NULL ORDER BY id DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, (page - 1) * pageSize);
    const total = this.prepare(
      `SELECT COUNT(*) AS c FROM ingredients WHERE ${where} AND deleted_at IS NULL`
    ).get(...params).c;
    return { list: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 0 };
  }

  /** 按名称批量查（供匹配度计算） */
  findByNames(names) {
    if (!names || names.length === 0) return [];
    const placeholders = names.map(() => '?').join(',');
    return this.prepare(
      `SELECT * FROM ingredients WHERE name IN (${placeholders}) AND deleted_at IS NULL`
    ).all(...names);
  }
}

module.exports = new IngredientRepo();
