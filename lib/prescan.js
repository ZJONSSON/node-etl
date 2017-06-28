const Streamz = require('streamz');
const Promise = require('bluebird');
const util = require('util');

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
    return Promise.resolve();

  const buffer = this.buffer;
  this.buffer = undefined;

  return Promise.try(() =>this.fn(buffer))
  .then(() => buffer.forEach(d => this.push(d)));
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
  this._push()
    .then( () => setImmediate( () => Streamz.prototype._flush(cb)));
};

module.exports = Prescan;