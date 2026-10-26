'use strict';

const productRepo = require('../../repositories/productRepo');
const skinProfileRepo = require('../../repositories/skinProfileRepo');
const matchService = require('../../services/matchService');
const helper = require('../../utils/helper');

/** 当前用户肤质 */
function currentSkinType(userId) {
  const profile = skinProfileRepo.findByUserId(userId);
  return (profile && profile.skin_type) || '中性';
}

/** 产品列表（含肤质匹配度，按匹配度降序） */
function list(req, res, next) {
  try {
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const category = req.query.category ? String(req.query.category).trim() : '';
    const conditions = ['status = 1'];
    const params = [];
    if (keyword) {
      conditions.push('(name LIKE ? OR brand LIKE ? OR description LIKE ?)');
      const like = `%${keyword}%`;
      params.push(like, like, like);
    }
    if (category) {
      conditions.push('category = ?');
      params.push(category);
    }
    const where = conditions.join(' AND ');
    const rows = productRepo.prepare(
      `SELECT * FROM products WHERE ${where} AND deleted_at IS NULL ORDER BY id DESC LIMIT 100`
    ).all(...params);

    const skinType = currentSkinType(req.user.id);
    const listData = rows.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.brand,
      category: p.category,
      imageUrl: p.image_url,
      description: p.description,
      matchScore: matchService.calcMatchScore(p, skinType),
    }));
    listData.sort((a, b) => b.matchScore - a.matchScore);

    return res.ok(listData);
  } catch (e) {
    return next(e);
  }
}

/** 产品详情（含匹配度 + 成分详情） */
function detail(req, res, next) {
  try {
    const product = productRepo.getById(Number(req.params.id));
    if (!product || product.status !== 1) return res.fail(404, '产品不存在或已下架');
    const skinType = currentSkinType(req.user.id);
    return res.ok({
      id: product.id,
      name: product.name,
      brand: product.brand,
      category: product.category,
      imageUrl: product.image_url,
      description: product.description,
      matchScore: matchService.calcMatchScore(product, skinType),
      matchReasons: matchService.matchReasons(product, skinType),
      ingredients: matchService.enrichIngredients(product),
    });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, detail };
