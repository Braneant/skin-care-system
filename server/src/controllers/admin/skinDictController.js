'use strict';

const skinDictRepo = require('../../repositories/skinDictRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 字典列表（支持 dictType 过滤） */
function list(req, res, next) {
  try {
    const dictType = req.query.dictType;
    const rows = skinDictRepo.listByType(dictType);
    return res.ok(rows);
  } catch (e) {
    return next(e);
  }
}

/** 新增字典 */
function create(req, res, next) {
  try {
    const { dictType, dictCode, dictName, dictValue, sort, remark } = req.body || {};
    if (!dictType || !dictCode || !dictName) throw new BusinessError(400, '请填写字典类型/编码/名称');
    if (skinDictRepo.findByTypeCode(dictType, dictCode)) {
      throw new BusinessError(409, '字典编码已存在');
    }
    const id = skinDictRepo.insert({
      dict_type: String(dictType),
      dict_code: String(dictCode),
      dict_name: String(dictName),
      dict_value: dictValue ? JSON.stringify(dictValue) : '{}',
      sort: Number(sort) || 0,
      status: 1,
      remark: remark || '',
    });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 编辑字典 */
function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!skinDictRepo.getById(id)) throw new BusinessError(404, '字典项不存在');
    const { dictName, dictValue, sort, status, remark } = req.body || {};
    const data = {};
    if (dictName !== undefined) data.dict_name = String(dictName);
    if (dictValue !== undefined) data.dict_value = JSON.stringify(dictValue);
    if (sort !== undefined) data.sort = Number(sort) || 0;
    if (status !== undefined) data.status = status ? 1 : 0;
    if (remark !== undefined) data.remark = remark;
    skinDictRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 删除字典 */
function remove(req, res, next) {
  try {
    skinDictRepo.hardDelete(Number(req.params.id));
    return res.ok({ id: Number(req.params.id) });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, update, remove };
