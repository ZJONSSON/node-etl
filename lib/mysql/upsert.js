const chain = require('../chain');
const script = require('./script');
const execute = require('./execute');
const Streamz = require('streamz');

module.exports = function upsert(pool,schema,table,options) {
  return chain(incoming => incoming
    .pipe(new script(pool,schema,table,options))
    .pipe(Streamz(d =>{ console.log(d); return d;}))
    .pipe(new execute(pool,options))
  );
};