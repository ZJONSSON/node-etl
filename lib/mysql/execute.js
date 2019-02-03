const Mysql = require('./mysql');

class Execute extends Mysql{
  constructor(pool,options) {
    super(pool,options);
  }
  async _fn(d,cb) {
    const res = await this.query(d,cb);
    if (this.options.pushResult) return res;
  }
}

module.exports = Execute;