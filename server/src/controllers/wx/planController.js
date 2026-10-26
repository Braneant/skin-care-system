'use strict';

const planRepo = require('../../repositories/planRepo');
const checkinRepo = require('../../repositories/checkinRepo');
const planStepProductRepo = require('../../repositories/planStepProductRepo');
const productRepo = require('../../repositories/productRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');
const { mapStepToCheckinKey, mapStepNameToKey } = require('../../config/skincareRules');

const VALID_PERIODS = ['morning', 'evening'];
const VALID_STEP_KEYS = ['cleanse', 'toner', 'serum', 'moisturize', 'sunscreen', 'repair'];

/** 给方案步骤标注打卡映射 key、步骤键与今日完成态 */
function annotateSteps(steps, todayCheckin) {
  return (steps || []).map((s) => {
    const key = mapStepToCheckinKey(s.step);
    return { ...s, key, stepKey: mapStepNameToKey(s.step), done: !!todayCheckin[key] };
  });
}

/** 组装方案步骤（含步骤键 + 绑定产品） */
function buildSteps(plan, bindings) {
  const bindMap = new Map(bindings.map((b) => [`${b.period}:${b.step_key}`, b]));
  const productMap = new Map();
  const steps = [];
  const push = (list, period) => {
    for (const s of list || []) {
      const stepKey = mapStepNameToKey(s.step);
      const b = bindMap.get(`${period}:${stepKey}`);
      if (b && b.product_id && !productMap.has(b.product_id)) {
        const p = productRepo.getById(b.product_id);
        productMap.set(b.product_id, p || null);
      }
      const product = b ? productMap.get(b.product_id) : null;
      steps.push({
        period,
        stepKey,
        step: s.step,
        desc: s.desc,
        productId: b ? b.product_id : null,
        product: product ? { id: product.id, name: product.name, brand: product.brand } : null,
      });
    }
  };
  push(helper.parseJson(plan.routine_morning, []), 'morning');
  push(helper.parseJson(plan.routine_evening, []), 'evening');
  return steps;
}

/** 获取我的个性化护肤方案（最新生效，追加今日打卡 + 步骤进度） */
function getPlan(req, res, next) {
  try {
    const plan = planRepo.latestByUser(req.user.id);
    if (!plan) return res.ok(null);

    const todayRow = checkinRepo.todayByUser(req.user.id);
    const todayCheckin = {
      cleanse: todayRow ? !!todayRow.cleanse : false,
      moisturize: todayRow ? !!todayRow.moisturize : false,
      sunscreen: todayRow ? !!todayRow.sunscreen : false,
    };

    const routineMorning = annotateSteps(helper.parseJson(plan.routine_morning, []), todayCheckin);
    const routineEvening = annotateSteps(helper.parseJson(plan.routine_evening, []), todayCheckin);

    const allSteps = [...routineMorning, ...routineEvening];
    const doneCount = allSteps.filter((s) => s.done).length;

    return res.ok({
      planId: plan.id,
      title: plan.title,
      routineMorning,
      routineEvening,
      ingredients: helper.parseJson(plan.ingredients, []),
      taboos: helper.parseJson(plan.taboos, []),
      updatedAt: plan.updated_at,
      todayCheckin,
      stepProgress: { done: doneCount, total: allSteps.length },
    });
  } catch (e) {
    return next(e);
  }
}

/** 方案步骤列表（含已绑定产品） */
function getSteps(req, res, next) {
  try {
    const plan = planRepo.latestByUser(req.user.id);
    if (!plan) return res.ok({ planId: null, steps: [] });
    const bindings = planStepProductRepo.listByPlan(plan.id);
    return res.ok({ planId: plan.id, steps: buildSteps(plan, bindings) });
  } catch (e) {
    return next(e);
  }
}

/** 绑定/解绑步骤产品（body 含 productId 绑定，空则解绑） */
function bindProduct(req, res, next) {
  try {
    const period = String(req.params.period);
    const stepKey = String(req.params.stepKey);
    if (!VALID_PERIODS.includes(period)) throw new BusinessError(400, 'period 取值非法');
    if (!VALID_STEP_KEYS.includes(stepKey)) throw new BusinessError(400, 'stepKey 取值非法');

    const plan = planRepo.latestByUser(req.user.id);
    if (!plan) throw new BusinessError(404, '暂无护肤方案');

    const productId = req.body && req.body.productId;
    if (productId) {
      if (!productRepo.getById(Number(productId))) throw new BusinessError(404, '产品不存在');
      planStepProductRepo.upsert(plan.id, period, stepKey, Number(productId));
    } else {
      planStepProductRepo.unbind(plan.id, period, stepKey);
    }

    const bindings = planStepProductRepo.listByPlan(plan.id);
    const steps = buildSteps(plan, bindings);
    const target = steps.find((s) => s.period === period && s.stepKey === stepKey);
    return res.ok({ planId: plan.id, period, stepKey, productId: target ? target.productId : null, product: target ? target.product : null });
  } catch (e) {
    return next(e);
  }
}

module.exports = { getPlan, getSteps, bindProduct };
