const Streamz = require('streamz');

class KeepOpen extends Streamz {
  constructor(timeout) {
    super();
    this.timeout = timeout || 1000;
  }

  _fn() {
    this.last = new Date();
    return Streamz.prototype._fn.apply(this,arguments);
  }

  end(d) {
    if (d !== null && d !== undefined)
      this.write(d);

    let timer = setInterval(() => {
      if (new Date() - this.last > this.timeout) {
        clearInterval(timer);
        Streamz.prototype.end.call(this);
      }
    },this.timeout);
  }
}

module.exports = KeepOpen;