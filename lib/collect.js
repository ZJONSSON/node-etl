var Streamz = require('streamz'),
    util = require('util');

function Collect(maxSize,maxDuration) {
  if (!(this instanceof Streamz))
    return new Collect(maxSize,maxDuration);
  Streamz.call(this);
  this.maxSize = maxSize;
  this.maxDuration = maxDuration;
  this.buffer = [];
}

util.inherits(Collect,Streamz);

Collect.prototype.buffer = undefined;

Collect.prototype._push = function() {
  if (this.buffer.length)
    this.push(this.buffer);

  if (this.timeout) {
    clearTimeout(this.timeout);
    this.timeout = undefined;
  }

  this.buffer = [];
};

Collect.prototype._fn = function(d) {
  this.buffer.push(d);
  
  if (this.maxDuration && !this.timeout)
    this.timeout = setTimeout(this._push.bind(this),this.maxDuration);

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