var Streamz = require('streamz'),
    util = require('util');

function Scan(count,fn) {
  if (!(this instanceof Scan))
    return new Scan(count,fn);
  Streamz.call(this);
  // Allow a custom collection function as first argument
  this.count = count;
  this.fn = fn;
  this.buffer = [];
}

util.inherits(Scan,Streamz);

Scan.prototype.buffer = undefined;

Scan.prototype._push = function() {
  var self = this;
  this.buffer.forEach(function(d) {
    self.push(d);
  });
  this.buffer = [];
};

Scan.prototype._fn = function(d) {
  this.i += 1;
  if (this.i > this.count)
    return this._push();

  this.buffer.push(d);
  return this.fn(d);
};

Scan.prototype._flush = function(cb) {
  var self = this;
  return Streamz.prototype._flush.call(this,function() {
    self._push();  
    setImmediate(cb);
  });
};

module.exports = Scan;