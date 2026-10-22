'use strict';

const BaseRepo = require('./baseRepo');

class FeedbackRepo extends BaseRepo {
  constructor() {
    super('feedbacks', { softDelete: false });
  }

  listByUser(userId) {
    return this.prepare(
      'SELECT * FROM feedbacks WHERE user_id = ? ORDER BY created_at DESC'
    ).all(userId);
  }

  /** 管理端列表（联用户昵称） */
  paginateWithUser(page = 1, pageSize = 10, status) {
    const where = status !== undefined && status !== '' ? 'f.status = ?' : '1=1';
    const params = status !== undefined && status !== '' ? [status] : [];
    const rows = this.prepare(
      `SELECT f.*, u.nickname FROM feedbacks f
       LEFT JOIN wx_users u ON u.id = f.user_id
       WHERE ${where}
       ORDER BY f.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, (page - 1) * pageSize);
    const total = this.prepare(
      `SELECT COUNT(*) AS c FROM feedbacks f WHERE ${where}`
    ).get(...params).c;
    return { list: rows, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 0 };
  }
}

module.exports = new FeedbackRepo();
