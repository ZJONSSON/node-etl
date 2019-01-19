const Streamz = require('streamz');
const Promise = require('bluebird');

class Prescan extends Streamz {
  constructor(count,fn) {
    super();
    // Allow a custom collection function as first argument
    this.count = count;
    this.fn = fn;
    this.buffer = [];
    this.i = 0;
  }

  _push() {
    if (!this.buffer)
      return Promise.resolve();

    const buffer = this.buffer;
    this.buffer = undefined;

    return Promise.try(() =>this.fn(buffer))
    .then(() => buffer.forEach(d => this.push(d)));
  }

  _fn(d) {
    if (!this.buffer)
      return d;

    this.i +=  d.length || 1;
    this.buffer.push(d);

    if (this.i >= this.count)
      return this._push();
  }

  _flush(cb) {
    this._push()
      .then( () => setImmediate( () => Streamz.prototype._flush(cb)));
  }
}

module.exports = Prescan;