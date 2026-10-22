'use strict';

const checkinRepo = require('../../repositories/checkinRepo');

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

/** 提交打卡（支持补卡覆盖） */
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
    return res.ok({
      cleanse: !!row.cleanse,
      moisturize: !!row.moisturize,
      sunscreen: !!row.sunscreen,
      date: row.checkin_date,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getToday, submit };
