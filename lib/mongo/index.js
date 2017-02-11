module.exports = {
  insert : require('./insert'),
  update : require('./update'),
  bulk: require('./bulk'),
  upsert : function() {
    var update = require('./update').apply(this,arguments);
    update.options.upsert = true;
    return update;
  }
};