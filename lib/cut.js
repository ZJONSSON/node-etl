const Streamz = require('streamz');
const util = require('util');

function Cut(maxLen,options) {
  if (!(this instanceof Cut))
    return new Cut(maxLen,options);

  if(!maxLen && isNaN(maxLen))
    throw 'MaxLen not defined';

  Streamz.call(this,options);

  this.maxLen = +maxLen;
  this.options = options || {};
}

util.inherits(Cut,Streamz);

Cut.prototype.buffer = '';

Cut.prototype._proto = {};

Cut.prototype.line = 0;

Cut.prototype._push = function(end) {
  if (this.buffer.length < this.maxLen && !end)
    return;

  const obj = Object.create(this._proto);
  obj.text = this.buffer.slice(0,this.maxLen);
  obj.__line = this.line++;
  this.push(obj);
  this.buffer = this.buffer.slice(this.maxLen);
  return this._push();
};

Cut.prototype._fn = function(d) {
  if (d instanceof Buffer || typeof d !== 'object')
    d = d.toString('utf8');

  if (typeof d === 'object') this._proto = d;
  this.buffer += (typeof d == 'string') ? d : d.text;

  this._push();
};

Cut.prototype._flush = function(cb) {
  this._push();
  setImmediate( () => Streamz.prototype._flush(cb));
};

module.exports = Cut;