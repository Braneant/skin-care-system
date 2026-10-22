'use strict';

const BaseRepo = require('./baseRepo');

class FavoriteRepo extends BaseRepo {
  constructor() {
    super('favorites', { softDelete: false });
  }

  findByUserArticle(userId, articleId) {
    return this.prepare(
      'SELECT * FROM favorites WHERE user_id = ? AND article_id = ?'
    ).get(userId, articleId);
  }

  /** 收藏/取消收藏（幂等），返回 {favorited, id} */
  toggle(userId, articleId) {
    const existing = this.findByUserArticle(userId, articleId);
    if (existing) {
      this.hardDelete(existing.id);
      return { favorited: false, id: null };
    }
    const id = this.insert({ user_id: userId, article_id: articleId });
    return { favorited: true, id };
  }

  listByUser(userId) {
    return this.prepare(
      `SELECT f.id, f.created_at, a.id AS article_id, a.title, a.cover_url, a.author, a.publish_at
       FROM favorites f JOIN articles a ON a.id = f.article_id
       WHERE f.user_id = ? AND a.deleted_at IS NULL
       ORDER BY f.created_at DESC`
    ).all(userId);
  }
}

module.exports = new FavoriteRepo();
