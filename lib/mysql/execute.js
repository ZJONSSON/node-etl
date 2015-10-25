var Mysql = require('./mysql'),
    util = require('util');

function Execute(pool,_c,options) {
  if (!(this instanceof Execute))
    return new Execute(pool,_c,options);

  if (isNaN(_c)) {
    options = _c;
    _c = undefined;
  }

  options = options || {};
  options.concurrency = _c;
  Mysql.call(this,pool,options);

}

util.inherits(Execute,Mysql);


Execute.prototype._fn = function(d) {
  var self = this;
  return this.query(d)
    .then(function(d) {
      return self.options.pushResult && d[0];
    });
};

module.exports = Execute;