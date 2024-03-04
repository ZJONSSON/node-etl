const Postgres = require('./postgres');

class Execute extends Postgres {
  constructor(pool, options = {}) {
    super(pool, options);
  }

  _fn(d, cb) {
    // TODO make transaction or use {maxBuffer:1} in options
    // console.log(d);
    return this.query(d, cb)
      .then(d => (this.options.pushResult || this.options.pushResults) && d || undefined);
  }
}

module.exports = (...params) => new Execute(...params);
