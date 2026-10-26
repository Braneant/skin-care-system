'use strict';

const ingredientRepo = require('../../repositories/ingredientRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

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
    status: ing.status,
  };
}

/** 成分库列表（管理端，含停用） */
function list(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const result = ingredientRepo.adminList(page, pageSize, keyword);
    result.list = result.list.map(serialize);
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

/** 新增成分 */
function create(req, res, next) {
  try {
    const { name, enName, aliases, functions, efficacy, riskLevel, suitableSkin, taboo, description, status } = req.body || {};
    if (!name) throw new BusinessError(400, '请输入成分名称');
    if (ingredientRepo.findByName(String(name).trim())) throw new BusinessError(409, '成分已存在');
    const id = ingredientRepo.insert({
      name: String(name).trim(),
      en_name: enName || '',
      aliases: JSON.stringify(Array.isArray(aliases) ? aliases : []),
      functions: JSON.stringify(Array.isArray(functions) ? functions : []),
      efficacy: efficacy || '',
      risk_level: ['低', '中', '高'].includes(riskLevel) ? riskLevel : '低',
      suitable_skin: JSON.stringify(Array.isArray(suitableSkin) ? suitableSkin : []),
      taboo: taboo || '',
      description: description || '',
      status: status === 0 ? 0 : 1,
    });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 编辑成分 */
function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!ingredientRepo.getById(id)) throw new BusinessError(404, '成分不存在');
    const { name, enName, aliases, functions, efficacy, riskLevel, suitableSkin, taboo, description, status } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = String(name).trim();
    if (enName !== undefined) data.en_name = enName;
    if (aliases !== undefined) data.aliases = JSON.stringify(Array.isArray(aliases) ? aliases : []);
    if (functions !== undefined) data.functions = JSON.stringify(Array.isArray(functions) ? functions : []);
    if (efficacy !== undefined) data.efficacy = efficacy;
    if (riskLevel !== undefined) data.risk_level = ['低', '中', '高'].includes(riskLevel) ? riskLevel : '低';
    if (suitableSkin !== undefined) data.suitable_skin = JSON.stringify(Array.isArray(suitableSkin) ? suitableSkin : []);
    if (taboo !== undefined) data.taboo = taboo;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status === 0 ? 0 : 1;
    ingredientRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 删除成分（软删除） */
function remove(req, res, next) {
  try {
    ingredientRepo.softDelete(Number(req.params.id));
    return res.ok({ id: Number(req.params.id) });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, update, remove };
