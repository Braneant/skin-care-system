'use strict';

const userProductRepo = require('../../repositories/userProductRepo');
const productRepo = require('../../repositories/productRepo');
const skinProfileRepo = require('../../repositories/skinProfileRepo');
const matchService = require('../../services/matchService');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

function serialize(up) {
  return {
    id: up.id,
    productId: up.product_id,
    status: up.status,
    matchedScore: up.matched_score,
    addedAt: up.added_at,
    product: {
      name: up.name,
      brand: up.brand,
      category: up.category,
      imageUrl: up.image_url,
      description: up.description,
      ingredients: helper.parseJson(up.ingredients, []),
    },
  };
}

/** 我的产品柜 */
function list(req, res, next) {
  try {
    return res.ok(userProductRepo.listByUser(req.user.id).map(serialize));
  } catch (e) {
    return next(e);
  }
}

/** 添加/更新产品柜（幂等 upsert） */
function add(req, res, next) {
  try {
    const { productId, status } = req.body || {};
    if (!productId) throw new BusinessError(400, '缺少 productId');
    const product = productRepo.getById(Number(productId));
    if (!product) throw new BusinessError(404, '产品不存在');

    const st = ['using', 'stopped', 'wish'].includes(status) ? status : 'using';
    const profile = skinProfileRepo.findByUserId(req.user.id);
    const skinType = (profile && profile.skin_type) || '中性';
    const matchedScore = matchService.calcMatchScore(product, skinType);

    userProductRepo.upsert(req.user.id, Number(productId), st, matchedScore);
    const row = userProductRepo.findByUserProduct(req.user.id, Number(productId));
    return res.ok({
      id: row.id,
      productId: row.product_id,
      status: row.status,
      matchedScore: row.matched_score,
    });
  } catch (e) {
    return next(e);
  }
}

/** 移除产品 */
function remove(req, res, next) {
  try {
    userProductRepo.remove(Number(req.params.id));
    return res.ok({ id: Number(req.params.id) });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, add, remove };
