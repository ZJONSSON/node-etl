const Postgres = require('./postgres');
const util = require('util');

function Execute(pool,options) {
  if (!(this instanceof Execute))
    return new Execute(pool,options);

  options = options || {};
  Postgres.call(this,pool,options);

}

util.inherits(Execute,Postgres);

Execute.prototype._fn = function(d,cb) {
  // TODO make transaction or use {maxBuffer:1} in options
  //console.log(d);
  return this.query(d,cb)
    .then(d => this.options.pushResult && d || undefined);
};

module.exports = Execute;