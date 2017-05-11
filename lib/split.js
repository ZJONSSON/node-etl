var Streamz = require('streamz'),
    util = require('util');

function Split(symbol) {
  if (!(this instanceof Streamz))
    return new Split(symbol);
  Streamz.call(this);
  this.symbol = symbol || '\n';
}

util.inherits(Split,Streamz);

Split.prototype.buffer = '';

Split.prototype.__line = 0;

Split.prototype._push = function() {
  if (this.buffer.text.trim().length)
    this.push(this.buffer);
  delete this.buffer;
};

Split.prototype._fn = function(d) {
  if (d instanceof Buffer || typeof d !== 'object')
    d = {text: d.toString('utf8')};

  if (!this.buffer) {
    this.buffer = Object.create(d);
    this.buffer.text = '';
  }

  var buffer = (this.buffer.text += d.text).split(this.symbol);

  buffer.slice(0,buffer.length-1)
    .forEach(function(d) {
      if (d.trim().length) {
        var obj = Object.create(this.buffer);
        obj.text = d;
        obj.__line = this.__line++;
        this.push(obj);
      }
    },this);

  this.buffer.text = buffer[buffer.length-1];
};

Split.prototype._flush = function(cb) {
  var self = this;
  return Streamz.prototype._flush.call(this,function() {
    self._push();
    setImmediate(cb);
  });
};

module.exports = Split;