var Streamz = require('streamz'),
    util = require('util');

function KeepOpen(timeout) {
  if (!(this instanceof Streamz))
    return new KeepOpen(timeout);
  Streamz.call(this);
  this.timeout = timeout || 1000;
}

util.inherits(KeepOpen,Streamz);

KeepOpen.prototype._fn = function(d) {
  this.last = new Date();
  return Streamz.prototype._fn.apply(this,arguments);
};

KeepOpen.prototype.end = function(d) {
  var self = this;
  if (d !== null && d !== undefined)
    this.write(d);

  var timer = setInterval(function() {
    if (new Date() - self.last > self.timeout) {
      clearInterval(timer);
      Streamz.prototype.end.call(self);
    }
  },self.timeout);
};

module.exports = KeepOpen;