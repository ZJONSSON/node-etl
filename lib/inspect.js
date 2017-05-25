const Streamz = require('streamz');
const util = require('util');

function Inspect(options) {
  if (!(this instanceof Streamz))
    return new Inspect(options);
  Streamz.call(this);

  this.options = this.options || {};
}

util.inherits(Inspect,Streamz);

Inspect.prototype._fn = function(d) {
  console.log(util.inspect(d,this.options));
};

module.exports = Inspect;