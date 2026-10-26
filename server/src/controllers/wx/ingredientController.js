'use strict';

const ingredientRepo = require('../../repositories/ingredientRepo');
const helper = require('../../utils/helper');

function serialize(ing) {
  return {
    id: ing.id,
    name: ing.name,
    enName: ing.en_name,
    aliases: helper.parseJson(ing.aliases, []),
    functions: helper.parseJson(ing.functions, []),
    efficacy: ing.efficacy,
    riskLevel: ing.risk_level,
    suitableSkin: helper.parseJson(ing.suitable_skin, []),
    taboo: ing.taboo,
    description: ing.description,
  };
}

/** 成分库检索（公开给小程序用户） */
function list(req, res, next) {
  try {
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const page = Number(req.query.page) || 1;
    const pageSize = Math.min(50, Number(req.query.pageSize) || 20);
    const result = ingredientRepo.search(keyword, page, pageSize);
    result.list = result.list.map(serialize);
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

/** 成分详情 */
function detail(req, res, next) {
  try {
    const ing = ingredientRepo.getById(Number(req.params.id));
    if (!ing || ing.status !== 1) return res.fail(404, '成分不存在');
    return res.ok(serialize(ing));
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, detail };
