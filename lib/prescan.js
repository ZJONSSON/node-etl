var Streamz = require('streamz'),
    Promise = require('bluebird'),
    util = require('util');

function Prescan(count,fn) {
  if (!(this instanceof Prescan))
    return new Prescan(count,fn);
  Streamz.call(this);
  // Allow a custom collection function as first argument
  this.count = count;
  this.fn = fn;
  this.buffer = [];
  this.i = 0;
}

util.inherits(Prescan,Streamz);

Prescan.prototype.buffer = undefined;

Prescan.prototype._push = function() {
  if (!this.buffer)
    return;

  var buffer = this.buffer;
  this.buffer = undefined;

  var self = this;
  return Promise.try(function() {
    return self.fn(buffer);
  })
  .then(function() {
    buffer.forEach(function(d) {
      self.push(d);
    });
  });
};

Prescan.prototype._fn = function(d) {
  if (!this.buffer)
    return d;

  this.i +=  d.length || 1;
  this.buffer.push(d);

  if (this.i >= this.count)
    return this._push();
};

Prescan.prototype._flush = function(cb) {
  var self = this;
  return Streamz.prototype._flush.call(this,function() {
    self._push();  
    setImmediate(cb);
  });
};

module.exports = Prescan;