var Streamz = require('streamz'),
    util = require('util');

function Stringify(indent,replacer) {
  if (!(this instanceof Streamz))
    return new Stringify(indent,replacer);
  Streamz.call(this);
  this.indent = indent;
  this.replacer = replacer;
}

util.inherits(Stringify,Streamz);

Stringify.prototype._fn = function(d) {
  return JSON.stringify(d,this.replacer,this.indent);
};
