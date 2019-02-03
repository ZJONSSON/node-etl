const wrap = require('../wrap');

module.exports = {
  insert : wrap(require('./insert')),
  update : wrap(require('./update')),
  bulk: wrap(require('./bulk')),
  upsert : function() {
    const update = new (require('./update'))(...arguments);
    update.options.upsert = true;
    return update;
  }
};