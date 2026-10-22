'use strict';

const detectRecordRepo = require('../../repositories/detectRecordRepo');
const helper = require('../../utils/helper');

/** 全量检测记录（联用户昵称） */
function list(req, res, next) {
  try {
    const { page, pageSize } = helper.pageParams(req.query);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const engine = req.query.engine;

    const conditions = ['1=1'];
    const params = [];
    if (keyword) {
      conditions.push('u.nickname LIKE ?');
      params.push(`%${keyword}%`);
    }
    if (engine) {
      conditions.push('d.engine = ?');
      params.push(engine);
    }
    const where = conditions.join(' AND ');

    const rows = detectRecordRepo.prepare(
      `SELECT d.*, u.nickname FROM detect_records d
       LEFT JOIN wx_users u ON u.id = d.user_id
       WHERE ${where} ORDER BY d.created_at DESC LIMIT ? OFFSET ?`
    ).all(...params, pageSize, (page - 1) * pageSize);
    const total = detectRecordRepo.prepare(
      `SELECT COUNT(*) AS c FROM detect_records d LEFT JOIN wx_users u ON u.id = d.user_id WHERE ${where}`
    ).get(...params).c;

    const list = rows.map((d) => ({
      id: d.id,
      nickname: d.nickname,
      imageUrl: d.image_url,
      engine: d.engine,
      degraded: !!d.degraded,
      skinType: d.skin_type,
      riskLevel: d.risk_level,
      score: d.score,
      issues: helper.parseJson(d.issues, []),
      dimensions: helper.parseJson(d.dimensions, {}),
      createdAt: d.created_at,
    }));
    return res.ok({ list, total, page, pageSize, totalPages: Math.ceil(total / pageSize) || 0 });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list };
