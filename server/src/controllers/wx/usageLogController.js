'use strict';

const usageLogRepo = require('../../repositories/usageLogRepo');
const productRepo = require('../../repositories/productRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 使用记录时间轴 */
function list(req, res, next) {
  try {
    const productId = req.query.productId ? Number(req.query.productId) : null;
    const rows = usageLogRepo.listByUser(req.user.id, productId);
    const productMap = new Map();
    for (const r of rows) {
      if (r.product_id && !productMap.has(r.product_id)) {
        const p = productRepo.getById(r.product_id);
        productMap.set(r.product_id, p ? p.name : null);
      }
    }
    return res.ok(
      rows.map((r) => ({
        id: r.id,
        productId: r.product_id,
        productName: productMap.get(r.product_id),
        action: r.action,
        note: r.note,
        skinSnapshot: helper.parseJson(r.skin_snapshot, null),
        createdAt: r.created_at,
      }))
    );
  } catch (e) {
    return next(e);
  }
}

/** 记录使用事件（start/stop/note） */
function create(req, res, next) {
  try {
    const { productId, action, note, skinSnapshot } = req.body || {};
    if (!productId || !action) throw new BusinessError(400, '请提供 productId 与 action');
    if (!['start', 'stop', 'note'].includes(action)) throw new BusinessError(400, 'action 取值非法');
    if (!productRepo.getById(Number(productId))) throw new BusinessError(404, '产品不存在');
    const id = usageLogRepo.create(req.user.id, { productId: Number(productId), action, note: note || '', skinSnapshot });
    return res.ok({ id, productId: Number(productId), action, createdAt: helper.now() });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create };
