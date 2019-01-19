const Streamz = require('streamz');
const util = require('util');

class Inspect extends Streamz {
  constructor(options) {
    super();
    this.options = options || {};
  }

  _fn(d) {
    console.log(util.inspect(d,this.options));
  }
}

module.exports = Inspect;