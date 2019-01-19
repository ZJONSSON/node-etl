const Streamz = require('streamz');

class Collect extends Streamz {
  constructor(maxSize,maxDuration,maxTextLength) {
      super();
    // Allow a custom collection function as first argument
    if (typeof maxSize === 'function')
      this._fn = maxSize;
    this.maxSize = maxSize;
    this.textLength = 0;
    this.maxTextLength = maxTextLength;
    this.maxDuration = maxDuration;
    this.buffer = [];
  }

  _push() {
    this.textLength = 0;
    if (this.buffer.length)
      this.push(this.buffer);

    if (this.timeout) {
      clearTimeout(this.timeout);
      this.timeout = undefined;
    }

    this.buffer = [];
  }

  _fn(d) {
    this.buffer.push(d);
    
    if (this.maxDuration && !this.timeout)
      this.timeout = setTimeout(this._push.bind(this),this.maxDuration);

    if (this.maxTextLength && (this.textLength += JSON.stringify(d).length) > this.maxTextLength)
      this._push();

    if(this.buffer.length >= this.maxSize)
      this._push();
  }

  _flush(cb) {
    this._push();
    setImmediate( () => Streamz.prototype._flush(cb));
  }
}

module.exports = Collect;