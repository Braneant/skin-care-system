'use strict';

const articleRepo = require('../../repositories/articleRepo');
const productRepo = require('../../repositories/productRepo');
const noticeRepo = require('../../repositories/noticeRepo');
const helper = require('../../utils/helper');
const { BusinessError } = require('../../middlewares/errorHandler');

const now = helper.now;

// ============ 文章 ============
function listArticles(req, res, next) {
  try {
    const { page, pageSize } = helper.pageParams(req.query);
    const status = req.query.status;
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const conditions = ['1=1'];
    const params = [];
    if (status !== undefined && status !== '') {
      conditions.push('status = ?');
      params.push(Number(status));
    }
    if (keyword) {
      conditions.push('(title LIKE ? OR author LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    const result = articleRepo.paginate({
      page,
      pageSize,
      where: conditions.join(' AND '),
      params,
      orderBy: 'id DESC',
    });
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

function createArticle(req, res, next) {
  try {
    const { title, coverUrl, content, author, status } = req.body || {};
    if (!title) throw new BusinessError(400, '请输入文章标题');
    const id = articleRepo.insert({
      title: String(title),
      cover_url: coverUrl || null,
      content: content || '',
      author: author || '平台小编',
      status: status === 0 ? 0 : 1,
      publish_at: now(),
    });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

function updateArticle(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!articleRepo.getById(id)) throw new BusinessError(404, '文章不存在');
    const { title, coverUrl, content, author, status } = req.body || {};
    const data = {};
    if (title !== undefined) data.title = String(title);
    if (coverUrl !== undefined) data.cover_url = coverUrl;
    if (content !== undefined) data.content = content;
    if (author !== undefined) data.author = author;
    if (status !== undefined) data.status = status === 0 ? 0 : 1;
    articleRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

function deleteArticle(req, res, next) {
  try {
    articleRepo.softDelete(Number(req.params.id));
    return res.ok({ id: Number(req.params.id) });
  } catch (e) {
    return next(e);
  }
}

// ============ 产品 ============
function listProducts(req, res, next) {
  try {
    const { page, pageSize } = helper.pageParams(req.query);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const conditions = ['1=1'];
    const params = [];
    if (keyword) {
      conditions.push('(name LIKE ? OR brand LIKE ?)');
      params.push(`%${keyword}%`, `%${keyword}%`);
    }
    const result = productRepo.paginate({
      page,
      pageSize,
      where: conditions.join(' AND '),
      params,
      orderBy: 'id DESC',
    });
    result.list = result.list.map((p) => ({
      ...p,
      ingredients: helper.parseJson(p.ingredients, []),
    }));
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

function createProduct(req, res, next) {
  try {
    const { name, imageUrl, brand, category, description, ingredients, status } = req.body || {};
    if (!name) throw new BusinessError(400, '请输入产品名称');
    const id = productRepo.insert({
      name: String(name),
      image_url: imageUrl || null,
      brand: brand || '',
      category: category || '',
      description: description || '',
      ingredients: JSON.stringify(Array.isArray(ingredients) ? ingredients : []),
      status: status === 0 ? 0 : 1,
    });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

function updateProduct(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!productRepo.getById(id)) throw new BusinessError(404, '产品不存在');
    const { name, imageUrl, brand, category, description, ingredients, status } = req.body || {};
    const data = {};
    if (name !== undefined) data.name = String(name);
    if (imageUrl !== undefined) data.image_url = imageUrl;
    if (brand !== undefined) data.brand = brand;
    if (category !== undefined) data.category = category;
    if (description !== undefined) data.description = description;
    if (ingredients !== undefined) data.ingredients = JSON.stringify(Array.isArray(ingredients) ? ingredients : []);
    if (status !== undefined) data.status = status === 0 ? 0 : 1;
    productRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

function deleteProduct(req, res, next) {
  try {
    productRepo.softDelete(Number(req.params.id));
    return res.ok({ id: Number(req.params.id) });
  } catch (e) {
    return next(e);
  }
}

// ============ 公告 ============
function listNotices(req, res, next) {
  try {
    const { page, pageSize } = helper.pageParams(req.query);
    const keyword = req.query.keyword ? String(req.query.keyword).trim() : '';
    const where = keyword ? 'title LIKE ?' : '1=1';
    const params = keyword ? [`%${keyword}%`] : [];
    const result = noticeRepo.paginate({ page, pageSize, where, params, orderBy: 'id DESC' });
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

function createNotice(req, res, next) {
  try {
    const { title, content, status } = req.body || {};
    if (!title) throw new BusinessError(400, '请输入公告标题');
    const id = noticeRepo.insert({
      title: String(title),
      content: content || '',
      status: status === 0 ? 0 : 1,
      publish_at: now(),
    });
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

function updateNotice(req, res, next) {
  try {
    const id = Number(req.params.id);
    if (!noticeRepo.getById(id)) throw new BusinessError(404, '公告不存在');
    const { title, content, status } = req.body || {};
    const data = {};
    if (title !== undefined) data.title = String(title);
    if (content !== undefined) data.content = content;
    if (status !== undefined) data.status = status === 0 ? 0 : 1;
    noticeRepo.updateById(id, data);
    return res.ok({ id });
  } catch (e) {
    return next(e);
  }
}

function deleteNotice(req, res, next) {
  try {
    noticeRepo.softDelete(Number(req.params.id));
    return res.ok({ id: Number(req.params.id) });
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  listArticles,
  createArticle,
  updateArticle,
  deleteArticle,
  listProducts,
  createProduct,
  updateProduct,
  deleteProduct,
  listNotices,
  createNotice,
  updateNotice,
  deleteNotice,
};
