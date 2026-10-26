'use strict';

const checkinRepo = require('../../repositories/checkinRepo');
const badgeService = require('../../services/badgeService');

/** 今日打卡状态 */
function getToday(req, res, next) {
  try {
    const row = checkinRepo.todayByUser(req.user.id);
    return res.ok({
      cleanse: row ? !!row.cleanse : false,
      moisturize: row ? !!row.moisturize : false,
      sunscreen: row ? !!row.sunscreen : false,
      date: row ? row.checkin_date : null,
    });
  } catch (e) {
    return next(e);
  }
}

/** 累计统计 + streak + 本周完成率 */
function stats(req, res, next) {
  try {
    return res.ok(badgeService.calcStats(req.user.id));
  } catch (e) {
    return next(e);
  }
}

/** 7 日周历视图（days 可调） */
function calendar(req, res, next) {
  try {
    const days = Math.min(90, Math.max(1, Number(req.query.days) || 7));
    return res.ok(badgeService.weeklyCalendar(req.user.id, days));
  } catch (e) {
    return next(e);
  }
}

/** 提交打卡（支持补卡覆盖），打卡后自动触发徽章发放 */
function submit(req, res, next) {
  try {
    const { type, cleanse, moisturize, sunscreen } = req.body || {};
    const data = {};
    if (type === 'cleanse') data.cleanse = 1;
    if (type === 'moisturize') data.moisturize = 1;
    if (type === 'sunscreen') data.sunscreen = 1;
    if (cleanse !== undefined) data.cleanse = cleanse ? 1 : 0;
    if (moisturize !== undefined) data.moisturize = moisturize ? 1 : 0;
    if (sunscreen !== undefined) data.sunscreen = sunscreen ? 1 : 0;

    const row = checkinRepo.upsert(req.user.id, data);
    // 打卡后自动发放徽章（幂等）
    const newBadges = badgeService.grantBadges(req.user.id);
    return res.ok({
      cleanse: !!row.cleanse,
      moisturize: !!row.moisturize,
      sunscreen: !!row.sunscreen,
      date: row.checkin_date,
      newBadges,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getToday, stats, calendar, submit };
