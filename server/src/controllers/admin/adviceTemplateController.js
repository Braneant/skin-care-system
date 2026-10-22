'use strict';

const adviceTemplateRepo = require('../../repositories/adviceTemplateRepo');
const { BusinessError } = require('../../middlewares/errorHandler');

/** 模板列表（当前医生） */
function list(req, res, next) {
  try {
    return res.ok(adviceTemplateRepo.listByDoctor(req.admin.id));
  } catch (e) {
    return next(e);
  }
}

/** 新增模板 */
function create(req, res, next) {
  try {
    const { title, content, category } = req.body || {};
    if (!title || !content) throw new BusinessError(400, '请填写模板标题与内容');
    const id = adviceTemplateRepo.insert({
      doctor_id: req.admin.id,
      title: String(title),
      content: String(content),
      category: category || '通用',
    });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 编辑模板 */
function update(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!adviceTemplateRepo.getById(id)) throw new BusinessError(404, '模板不存在');
    const { title, content, category } = req.body || {};
    const data = {};
    if (title !== undefined) data.title = String(title);
    if (content !== undefined) data.content = String(content);
    if (category !== undefined) data.category = category;
    adviceTemplateRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

/** 删除模板 */
function remove(req, res, next) {
  try {
    adviceTemplateRepo.softDelete(Number(req.params.id));
    return res.ok({ id: Number(req.params.id) });
  } catch (e) {
    return next(e);
  }
}

module.exports = { list, create, update, remove };
