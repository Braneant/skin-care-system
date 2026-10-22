'use strict';

const BaseRepo = require('./baseRepo');

class SkinDictRepo extends BaseRepo {
  constructor() {
    super('skin_dict', { softDelete: false });
  }

  listByType(dictType) {
    if (dictType) {
      return this.prepare(
        'SELECT * FROM skin_dict WHERE dict_type = ? AND status = 1 ORDER BY sort ASC, id ASC'
      ).all(dictType);
    }
    return this.prepare(
      'SELECT * FROM skin_dict WHERE status = 1 ORDER BY dict_type ASC, sort ASC, id ASC'
    ).all();
  }

  findByTypeCode(dictType, dictCode) {
    return this.prepare(
      'SELECT * FROM skin_dict WHERE dict_type = ? AND dict_code = ?'
    ).get(dictType, dictCode);
  }
}

module.exports = new SkinDictRepo();
