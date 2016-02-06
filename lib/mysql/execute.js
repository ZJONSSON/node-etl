var Mysql = require('./mysql'),
    util = require('util');

function Execute(pool,options) {
  if (!(this instanceof Execute))
    return new Execute(pool,options);

  options = options || {};
  Mysql.call(this,pool,options);

}

util.inherits(Execute,Mysql);

Execute.prototype._fn = function(d,cb) {
  var self = this;
  return this.query(d,cb)
    .then(function(d) {
      return self.options.pushResult && d;
    });
};

module.exports = Execute;