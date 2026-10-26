'use strict';

const detectRecordRepo = require('../../repositories/detectRecordRepo');
const adviceRepo = require('../../repositories/adviceRepo');
const helper = require('../../utils/helper');

/** 报告历史时间轴：检测记录 + 医生建议，按日期归档 */
function timeline(req, res, next) {
  try {
    const userId = req.user.id;
    const detects = detectRecordRepo.listByUser(userId, 100).map((r) => ({
      type: 'detect',
      id: r.id,
      date: helper.isoToDate(r.created_at),
      createdAt: r.created_at,
      score: r.score,
      riskLevel: r.risk_level,
      skinType: r.skin_type,
      issues: helper.parseJson(r.issues, []),
      imageUrl: r.image_url,
    }));
    const advices = adviceRepo.listByUser(userId).map((a) => ({
      type: 'advice',
      id: a.id,
      date: helper.isoToDate(a.created_at),
      createdAt: a.created_at,
      content: a.content,
      doctorName: a.doctor_name,
    }));

    const all = [...detects, ...advices].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));

    // 按日期归档
    const groups = [];
    const map = new Map();
    for (const item of all) {
      if (!map.has(item.date)) {
        const group = { date: item.date, items: [] };
        map.set(item.date, group);
        groups.push(group);
      }
      map.get(item.date).items.push(item);
    }
    return res.ok(groups);
  } catch (e) {
    return next(e);
  }
}

module.exports = { timeline };
