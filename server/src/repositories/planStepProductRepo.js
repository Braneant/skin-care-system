'use strict';

const BaseRepo = require('./baseRepo');
const helper = require('../utils/helper');

class PlanStepProductRepo extends BaseRepo {
  constructor() {
    super('plan_step_product', { softDelete: false });
  }

  listByPlan(planId) {
    return this.prepare(
      'SELECT * FROM plan_step_product WHERE plan_id = ? ORDER BY period ASC, id ASC'
    ).all(planId);
  }

  findByPlanStep(planId, period, stepKey) {
    return this.prepare(
      'SELECT * FROM plan_step_product WHERE plan_id = ? AND period = ? AND step_key = ?'
    ).get(planId, period, stepKey);
  }

  /** 绑定/更新产品（UNIQUE(plan_id, period, step_key) 冲突则更新 product_id） */
  upsert(planId, period, stepKey, productId) {
    const t = helper.now();
    return this.prepare(
      `INSERT INTO plan_step_product (plan_id, period, step_key, product_id, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)
       ON CONFLICT(plan_id, period, step_key) DO UPDATE SET product_id = excluded.product_id, updated_at = excluded.updated_at`
    ).run(planId, period, stepKey, productId, t, t);
  }

  /** 解绑产品 */
  unbind(planId, period, stepKey) {
    return this.prepare(
      'DELETE FROM plan_step_product WHERE plan_id = ? AND period = ? AND step_key = ?'
    ).run(planId, period, stepKey);
  }
}

module.exports = new PlanStepProductRepo();
