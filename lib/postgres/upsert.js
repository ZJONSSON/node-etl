const chain = require('../chain');
const script = require('./script');
const execute = require('./execute');

module.exports = function upsert(pool,schema,table,options) {
  return chain(inStream => inStream
    .pipe(new script(pool, schema, table, options))
    .pipe(new execute(pool, options))
  );
};
