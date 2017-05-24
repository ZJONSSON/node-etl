const Streamz = require('streamz');
const util = require('util');

function Stringify(indent,replacer,newline) {
  if (!(this instanceof Streamz))
    return new Stringify(indent,replacer,newline);
  Streamz.call(this);
  this.indent = indent;
  this.replacer = replacer;
  this.newline = newline;
}

util.inherits(Stringify,Streamz);

Stringify.prototype._fn = function(d) {
  return JSON.stringify(d,this.replacer,this.indent) + (this.newline ? '\n' : '');
};

module.exports = Stringify;