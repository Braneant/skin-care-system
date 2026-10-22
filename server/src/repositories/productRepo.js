'use strict';

const BaseRepo = require('./baseRepo');

class ProductRepo extends BaseRepo {
  constructor() {
    super('products', { softDelete: true });
  }

  listPublished() {
    return this.list({ where: 'status = 1', orderBy: 'id DESC' });
  }
}

module.exports = new ProductRepo();
