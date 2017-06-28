const Streamz = require('streamz');
const util = require('util');

function Collect(maxSize,maxDuration,maxTextLength) {
  if (!(this instanceof Streamz))
    return new Collect(maxSize,maxDuration,maxTextLength);
  Streamz.call(this);
  // Allow a custom collection function as first argument
  if (typeof maxSize === 'function')
    this._fn = maxSize;
  this.maxSize = maxSize;
  this.textLength = 0;
  this.maxTextLength = maxTextLength;
  this.maxDuration = maxDuration;
  this.buffer = [];
}

util.inherits(Collect,Streamz);

Collect.prototype.buffer = undefined;

Collect.prototype._push = function() {
  this.textLength = 0;
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

  if (this.maxTextLength && (this.textLength += JSON.stringify(d).length) > this.maxTextLength)
    this._push();

  if(this.buffer.length >= this.maxSize)
    this._push();
};

Collect.prototype._flush = function(cb) {
  this._push();
  setImmediate( () => Streamz.prototype._flush(cb));
};

module.exports = Collect;