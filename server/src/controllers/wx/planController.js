'use strict';

const planRepo = require('../../repositories/planRepo');
const helper = require('../../utils/helper');

/** 获取我的个性化护肤方案（最新生效） */
function getPlan(req, res, next) {
  try {
    const plan = planRepo.latestByUser(req.user.id);
    if (!plan) return res.ok(null);
    return res.ok({
      planId: plan.id,
      title: plan.title,
      routineMorning: helper.parseJson(plan.routine_morning, []),
      routineEvening: helper.parseJson(plan.routine_evening, []),
      ingredients: helper.parseJson(plan.ingredients, []),
      taboos: helper.parseJson(plan.taboos, []),
      updatedAt: plan.updated_at,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getPlan };
