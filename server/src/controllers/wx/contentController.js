'use strict';

const articleRepo = require('../../repositories/articleRepo');
const favoriteRepo = require('../../repositories/favoriteRepo');
const noticeRepo = require('../../repositories/noticeRepo');
const feedbackRepo = require('../../repositories/feedbackRepo');
const adviceRepo = require('../../repositories/adviceRepo');

/** 从 HTML 正文派生纯文本摘要（去标题与标签、合并空白、超长截断加省略号） */
function deriveSummary(html, maxLen = 80) {
  if (!html) return '';
  const text = String(html)
    .replace(/<h[1-6][^>]*>[\s\S]*?<\/h[1-6]>/gi, ' ')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim();
  if (text.length <= maxLen) return text;
  return `${text.slice(0, maxLen)}…`;
}

/** 文章列表（公开） */
function listArticles(req, res, next) {
  try {
    const page = Number(req.query.page) || 1;
    const pageSize = Number(req.query.pageSize) || 10;
    const { list, total, totalPages } = articleRepo.listPublished(page, pageSize);
    return res.ok({
      list: list.map((a) => ({
        id: a.id,
        title: a.title,
        coverUrl: a.cover_url,
        summary: deriveSummary(a.content),
        author: a.author,
        viewCount: a.view_count,
        publishAt: a.publish_at,
      })),
      total,
      page,
      pageSize,
      totalPages,
    });
  } catch (e) {
    return next(e);
  }
}

/** 文章详情（浏览量 +1） */
function getArticle(req, res, next) {
  try {
    const article = articleRepo.getPublishedById(Number(req.params.id));
    if (!article) return res.fail(404, '文章不存在或已下架');
    articleRepo.incrView(article.id);
    const favorited = !!favoriteRepo.findByUserArticle(req.user.id, article.id);
    return res.ok({
      id: article.id,
      title: article.title,
      coverUrl: article.cover_url,
      summary: deriveSummary(article.content),
      content: article.content,
      author: article.author,
      viewCount: article.view_count + 1,
      publishAt: article.publish_at,
      favorited,
    });
  } catch (e) {
    return next(e);
  }
}

/** 收藏/取消收藏（幂等） */
function toggleFavorite(req, res, next) {
  try {
    const articleId = Number(req.body && req.body.articleId);
    if (!articleId) return res.fail(400, '缺少 articleId');
    const result = favoriteRepo.toggle(req.user.id, articleId);
    return res.ok(result);
  } catch (e) {
    return next(e);
  }
}

/** 我的收藏 */
function listFavorites(req, res, next) {
  try {
    return res.ok(favoriteRepo.listByUser(req.user.id));
  } catch (e) {
    return next(e);
  }
}

/** 公告列表 */
function listNotices(req, res, next) {
  try {
    return res.ok(
      noticeRepo.listPublished().map((n) => ({
        id: n.id,
        title: n.title,
        publishAt: n.publish_at,
      }))
    );
  } catch (e) {
    return next(e);
  }
}

/** 公告详情 */
function getNotice(req, res, next) {
  try {
    const notice = noticeRepo.getPublishedById(Number(req.params.id));
    if (!notice) return res.fail(404, '公告不存在或已下架');
    return res.ok({
      id: notice.id,
      title: notice.title,
      content: notice.content,
      publishAt: notice.publish_at,
    });
  } catch (e) {
    return next(e);
  }
}

/** 提交反馈 */
function submitFeedback(req, res, next) {
  try {
    const content = String((req.body && req.body.content) || '').trim();
    if (!content) return res.fail(400, '反馈内容不能为空');
    const id = feedbackRepo.insert({ user_id: req.user.id, content, status: 0 });
    return res.ok({ feedbackId: id });
  } catch (e) {
    return next(e);
  }
}

/** 我的医生建议（只读） */
function getMyAdvice(req, res, next) {
  try {
    return res.ok(
      adviceRepo.listByUser(req.user.id).map((a) => ({
        id: a.id,
        content: a.content,
        doctorName: a.doctor_name,
        detectRecordId: a.detect_record_id,
        createdAt: a.created_at,
      }))
    );
  } catch (e) {
    return next(e);
  }
}

module.exports = {
  listArticles,
  getArticle,
  toggleFavorite,
  listFavorites,
  listNotices,
  getNotice,
  submitFeedback,
  getMyAdvice,
};
