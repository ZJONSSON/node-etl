const Postgres = require('./postgres');

class Execute extends Postgres {
  constructor(pool, options = {}) {
    super(pool, options);
  }

  async _fn(d, cb) {
    // TODO make transaction or use {maxBuffer:1} in options
    // console.log(d);
    let res = await this.query(d, cb);
    if (this.options.pushResult) return res;
  }
}

module.exports = Execute;
