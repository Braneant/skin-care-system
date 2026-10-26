'use strict';

const badgeService = require('../../services/badgeService');
const detectRecordRepo = require('../../repositories/detectRecordRepo');
const planRepo = require('../../repositories/planRepo');
const checkinRepo = require('../../repositories/checkinRepo');
const helper = require('../../utils/helper');
const { mapStepToCheckinKey } = require('../../config/skincareRules');

const CHECKIN_LABELS = { cleanse: '清洁', moisturize: '保湿', sunscreen: '防晒' };

/** 首页聚合：今日待办 + streak + 本周环 + 最新得分 */
function summary(req, res, next) {
  try {
    const userId = req.user.id;
    const stats = badgeService.calcStats(userId);

    // 最新得分
    const latest = detectRecordRepo.latestByUser(userId);
    const latestScore = latest ? latest.score : null;

    // 今日打卡态
    const todayRow = checkinRepo.todayByUser(userId);
    const todayCheckin = {
      cleanse: todayRow ? !!todayRow.cleanse : false,
      moisturize: todayRow ? !!todayRow.moisturize : false,
      sunscreen: todayRow ? !!todayRow.sunscreen : false,
    };

    // 待办：打卡三项 + 方案步骤（按映射）
    const todo = ['cleanse', 'moisturize', 'sunscreen'].map((key) => ({
      key,
      label: CHECKIN_LABELS[key],
      done: !!todayCheckin[key],
      url: '/pages/checkin/index',
    }));

    const plan = planRepo.latestByUser(userId);
    if (plan) {
      const morning = helper.parseJson(plan.routine_morning, []);
      const evening = helper.parseJson(plan.routine_evening, []);
      const pushSteps = (steps, period) => {
        for (const s of steps || []) {
          const key = mapStepToCheckinKey(s.step);
          todo.push({
            key: 'planStep',
            checkinKey: key,
            label: `${period === 'morning' ? '晨间' : '晚间'}·${s.step}`,
            done: !!todayCheckin[key],
            url: '/pages/plan/index',
          });
        }
      };
      pushSteps(morning, 'morning');
      pushSteps(evening, 'evening');
    }

    return res.ok({
      streak: stats.streak,
      weekRate: stats.weekRate,
      latestScore,
      todayTodo: todo,
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { summary };
