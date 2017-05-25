const Mysql = require('./mysql');
const util = require('util');

function Execute(pool,options) {
  if (!(this instanceof Execute))
    return new Execute(pool,options);

  options = options || {};
  Mysql.call(this,pool,options);
}

util.inherits(Execute,Mysql);

Execute.prototype._fn = function(d,cb) {
  return this.query(d,cb)
    .then(d => this.options.pushResult && d || undefined);
};

module.exports = Execute;