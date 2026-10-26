'use strict';

const badgeService = require('../../services/badgeService');

/** 徽章墙：已获 + 未解锁 + 进度（查询时也会幂等补发应得徽章） */
function list(req, res, next) {
  try {
    // 查询时幂等补发（§8#3：随补卡重算，无副作用）
    badgeService.grantBadges(req.user.id);
    return res.ok(badgeService.getBadgeWall(req.user.id));
  } catch (e) {
    return next(e);
  }
}

module.exports = { list };
