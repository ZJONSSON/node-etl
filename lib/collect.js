var Streamz = require('streamz'),
    util = require('util');

function Collect(maxSize) {
  if (!(this instanceof Streamz))
    return new Collect(maxSize);
  Streamz.call(this);
  this.maxSize = maxSize;
}

util.inherits(Collect,Streamz);

Collect.prototype.buffer = undefined;

Collect.prototype._push = function() {
  if (this.buffer.length)
    this.push(this.buffer);
  this.buffer = [];
};

Collect.prototype._fn = function(d) {
  if (!this.buffer) 
    this.buffer = [];

  this.buffer.push(d);
  
  
  if(this.buffer.length >= this.maxSize)
    this._push();
};

Collect.prototype._flush = function(cb) {
  var self = this;
  return Streamz.prototype._flush.call(this,function() {
    self._push();  
    setImmediate(cb);
  });
};

module.exports = Collect;