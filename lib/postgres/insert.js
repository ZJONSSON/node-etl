const chain = require('../chain');
const script = require('./script');
const execute = require('./execute');

module.exports = function upsert(pool,schema,table,options) {
  options = Object.assign({}, options, {upsert: false});
  return chain(inStream => inStream
    .pipe(script(pool, schema, table, options))
    .pipe(execute(pool, options))
  );
};
