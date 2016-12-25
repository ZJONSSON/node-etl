var chain = require('../chain'),
    script = require('./script'),
    execute = require('./execute');

module.exports = function upsert(pool,schema,table,options) {
  return chain(function(incoming) {
    return incoming
      .pipe(script(pool,schema,table,options))
      .pipe(execute(pool,options));
  });
};