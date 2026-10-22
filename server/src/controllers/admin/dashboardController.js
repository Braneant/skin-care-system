'use strict';

const { getDb } = require('../../config/database');
const helper = require('../../utils/helper');

const DAY = 24 * 3600 * 1000;

function isoDaysAgo(n) {
  return new Date(Date.now() - n * DAY).toISOString();
}

/** 看板汇总 */
function summary(req, res, next) {
  try {
    const db = getDb();
    const since7 = isoDaysAgo(7);
    const since6 = isoDaysAgo(6);

    const totalUsers = db.prepare('SELECT COUNT(*) AS c FROM wx_users WHERE deleted_at IS NULL').get().c;
    const newUsers7d = db.prepare('SELECT COUNT(*) AS c FROM wx_users WHERE created_at >= ?').get(since7).c;
    const totalAdmin = db.prepare('SELECT COUNT(*) AS c FROM admin_users WHERE deleted_at IS NULL').get().c;
    const totalDetect = db.prepare('SELECT COUNT(*) AS c FROM detect_records').get().c;

    // 活跃用户 = 近 7 日有登录/打卡/检测行为的去重用户
    const activeUsers7d = db.prepare(
      `SELECT COUNT(DISTINCT user_id) AS c FROM (
         SELECT user_id FROM detect_records WHERE created_at >= ?
         UNION
         SELECT user_id FROM checkin_records WHERE created_at >= ?
         UNION
         SELECT id AS user_id FROM wx_users WHERE last_login_at >= ?
       )`
    ).get(since7, since7, since7).c;

    // 近 7 日新增用户趋势（按日）
    const userTrendRows = db.prepare(
      `SELECT substr(created_at, 1, 10) AS d, COUNT(*) AS c
       FROM wx_users WHERE created_at >= ? GROUP BY d ORDER BY d ASC`
    ).all(since7);

    // 近 7 日活跃用户趋势（按日）
    const activeTrendRows = db.prepare(
      `SELECT substr(t, 1, 10) AS d, COUNT(DISTINCT user_id) AS c FROM (
         SELECT user_id, created_at AS t FROM detect_records WHERE created_at >= ?
         UNION ALL
         SELECT user_id, created_at AS t FROM checkin_records WHERE created_at >= ?
         UNION ALL
         SELECT id AS user_id, last_login_at AS t FROM wx_users WHERE last_login_at >= ?
       ) GROUP BY d ORDER BY d ASC`
    ).all(since7, since7, since7);

    // 问题分布（issues JSON 聚合）
    const issueRows = db.prepare(
      "SELECT issues FROM detect_records WHERE issues IS NOT NULL AND issues != '[]'"
    ).all();
    const counter = new Map();
    for (const row of issueRows) {
      const issues = helper.parseJson(row.issues, []);
      for (const it of issues) {
        const key = (it && it.type) || '其他';
        counter.set(key, (counter.get(key) || 0) + 1);
      }
    }
    const issueDist = Array.from(counter.entries())
      .map(([type, count]) => ({ type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return res.ok({
      totalUsers,
      newUsers7d,
      activeUsers7d,
      totalAdmin,
      totalDetect,
      issueDist,
      userTrend: userTrendRows,
      activeTrend: activeTrendRows,
      since: since6,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { summary };
