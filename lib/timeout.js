const Streamz = require('streamz');

class Timeout extends Streamz {
  constructor(ms,options) {
    super(options);
    this.interval = setInterval(() => {
      if (this.last && (new Date()) - this.last > ms) {
        this.emit('error','ETL_TIMEOUT');
        clearInterval(this.interval);
      }
    },ms);
  }

  _fn(d) {
    this.last = new Date();
    return d;
  }

  _flush(cb) {
    clearInterval(this.interval);
    return Streamz.prototype._flush.call(this,cb);
  }
}

module.exports = Timeout;