'use strict';

const BaseRepo = require('./baseRepo');

class AdviceTemplateRepo extends BaseRepo {
  constructor() {
    super('advice_templates', { softDelete: true });
  }

  listByDoctor(doctorId) {
    return this.prepare(
      'SELECT * FROM advice_templates WHERE doctor_id = ? AND deleted_at IS NULL ORDER BY created_at DESC'
    ).all(doctorId);
  }
}

module.exports = new AdviceTemplateRepo();
