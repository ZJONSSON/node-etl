const chain = require('../chain');
const script = require('./script');
const execute = require('./execute');

module.exports = function upsert(pool,schema,table,options) {
  return chain(incoming => incoming
    .pipe(script(pool,schema,table,options))
    .pipe(execute(pool,options))
  );
};