'use strict';

const envService = require('../../services/envService');
const detectRecordRepo = require('../../repositories/detectRecordRepo');
const { config } = require('../../config');

/** UV/天气提醒卡 */
function uv(req, res, next) {
  (async () => {
    try {
      const city = req.query.city ? String(req.query.city).trim() : config.weatherCity;
      const data = await envService.getUv(city, new Date());
      return res.ok(data);
    } catch (e) {
      return next(e);
    }
  })();
}

/** 季节护理提示 */
function seasonTip(req, res, next) {
  try {
    return res.ok(envService.getSeasonTip(new Date()));
  } catch (e) {
    return next(e);
  }
}

/** 复测提醒：距上次检测天数 */
function recheck(req, res, next) {
  try {
    const latest = detectRecordRepo.latestByUser(req.user.id);
    if (!latest) {
      return res.ok({ daysSince: null, latestDate: null, latestScore: null, suggested: true, message: '尚未检测，建议完成首次测肤' });
    }
    const latestDate = new Date(latest.created_at);
    const daysSince = Math.floor((Date.now() - latestDate.getTime()) / 86400000);
    const suggested = daysSince >= 30;
    return res.ok({
      daysSince,
      latestDate: latest.created_at,
      latestScore: latest.score,
      suggested,
      message: suggested ? `距上次测肤已 ${daysSince} 天，建议复测` : `距上次测肤 ${daysSince} 天，继续保持`,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { uv, seasonTip, recheck };
