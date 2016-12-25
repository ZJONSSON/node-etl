var Postgres = require('./postgres'),
    util = require('util');

function Execute(pool,options) {
  if (!(this instanceof Execute))
    return new Execute(pool,options);

  options = options || {};
  Postgres.call(this,pool,options);

}

util.inherits(Execute,Postgres);

Execute.prototype._fn = function(d,cb) {
  var self = this;
  // TODO make transaction or use {maxBuffer:1} in options
	//console.log(d);
  return this.query(d,cb)
    .then(function(d) {
      return self.options.pushResult && d;
    });
};

module.exports = Execute;