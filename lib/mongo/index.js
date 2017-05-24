module.exports = {
  insert : require('./insert'),
  update : require('./update'),
  bulk: require('./bulk'),
  upsert : function() {
    const update = require('./update').apply(this,arguments);
    update.options.upsert = true;
    return update;
  }
};