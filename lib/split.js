const Streamz = require('streamz');

class Split extends Streamz {
  constructor(symbol) {
    super();
    this.symbol = symbol || '\n';
    this.buffer = '';
    this.__line = 0;
  }
  _push() {
    if (this.buffer && this.buffer.text.trim().length)
      this.push(this.buffer);
    delete this.buffer;
  }

  _fn(d) {
    if (d instanceof Buffer || typeof d !== 'object')
      d = { text: d.toString('utf8') };

    if (!this.buffer) {
      this.buffer = Object.create(d);
      this.buffer.text = '';
    }

    const buffer = (this.buffer.text += d.text).split(this.symbol);

    buffer.slice(0,buffer.length-1)
      .forEach(d => {
        d = d.trim();
        if (d.length) {
          const obj = Object.create(this.buffer);
          obj.text = d;
          obj.__line = this.__line++;
          this.push(obj);
        }
      },this);

    this.buffer.text = buffer[buffer.length-1];
  }

  _flush(cb) {
    this._push();
    setImmediate( () => Streamz.prototype._flush(cb));
  } 
}

module.exports = Split;