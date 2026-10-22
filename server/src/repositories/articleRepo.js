'use strict';

const BaseRepo = require('./baseRepo');

class ArticleRepo extends BaseRepo {
  constructor() {
    super('articles', { softDelete: true });
  }

  listPublished(page = 1, pageSize = 10) {
    return this.paginate({
      where: 'status = 1',
      orderBy: 'publish_at DESC, id DESC',
      page,
      pageSize,
    });
  }

  /** 增加浏览量 */
  incrView(id) {
    return this.prepare(
      'UPDATE articles SET view_count = view_count + 1 WHERE id = ?'
    ).run(id);
  }

  getPublishedById(id) {
    return this.prepare(
      'SELECT * FROM articles WHERE id = ? AND status = 1 AND deleted_at IS NULL'
    ).get(id);
  }
}

module.exports = new ArticleRepo();
