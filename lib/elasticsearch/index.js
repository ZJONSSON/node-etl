var bulk = require('./bulk');

module.exports = {
  bulk : bulk,
  index : bulk.bind(bulk,'index'),
  update : bulk.bind(null,'update'),
  upsert : bulk.bind(null,'upsert'),
  delete : bulk.bind(bulk,'delete'),
  find : require('./find')
};