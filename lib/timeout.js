const Streamz = require('streamz');
const util = require('util');

function Timeout(ms) {
  if (!(this instanceof Streamz))
    return new Timeout(ms);
  Streamz.call(this);
  
  this.interval = setInterval(() => {
    if (this.last && (new Date()) - this.last > ms) {
      this.emit('error','ETL_TIMEOUT');
      clearInterval(this.interval);
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