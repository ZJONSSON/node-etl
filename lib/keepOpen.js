const Streamz = require('streamz');
const util = require('util');

function KeepOpen(timeout) {
  if (!(this instanceof Streamz))
    return new KeepOpen(timeout);
  Streamz.call(this);
  this.timeout = timeout || 1000;
}

util.inherits(KeepOpen,Streamz);

KeepOpen.prototype._fn = function() {
  this.last = new Date();
  return Streamz.prototype._fn.apply(this,arguments);
};

KeepOpen.prototype.end = function(d) {
  if (d !== null && d !== undefined)
    this.write(d);

  let timer = setInterval(() => {
    if (new Date() - this.last > this.timeout) {
      clearInterval(timer);
      Streamz.prototype.end.call(this);
    }
  },this.timeout);
};

module.exports = KeepOpen;