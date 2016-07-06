var Streamz = require('streamz'),
    util = require('util');

function Timeout(ms) {
  if (!(this instanceof Streamz))
    return new Timeout(ms);
  Streamz.call(this);
  var self = this;
  
  this.interval = setInterval(function() {
    if (self.last && (new Date())-self.last > ms) {
      self.emit('error','ETL_TIMEOUT');
      clearInterval(self.interval);
    }
  },ms);
}

util.inherits(Timeout,Streamz);

Timeout.prototype._fn = function(d) {
  this.last = new Date();
  return d;
};

Timeout.prototype._flush = function(cb) {
  clearInterval(this.interval);
  return Streamz.prototype._flush.call(this,cb);
};

module.exports = Timeout;