const Streamz = require('streamz');
const Promise = require('bluebird');

class Update extends Streamz {
  constructor(_c,collection,keys,options) {
    super(_c, null, options);
    if (isNaN(_c)) {
      options = keys;
      keys = collection;
      collection = _c;
      _c = undefined;
    }

    if (keys === undefined)
      throw new Error('Missing Keys');

    this.collection = Promise.resolve(collection);
    this.options = options || {};
    this.keys = [].concat(keys);
  }

  async _fn(d) {
    const collection = await this.collection;
    const bulk = collection.initializeUnorderedBulkOp();

    [].concat(d || []).forEach(d => {
      const criteria = this.keys.reduce((p,key) => {
        if (d[key] === undefined)
          throw new Error('Key not found in data');
        p[key] = d[key];
        delete d[key];
        return p;
      },{});

      let op = bulk.find(criteria);

      if (this.options.upsert)
        op = op.upsert();

      op.updateOne({$set:d});
    });

    const res = await bulk.execute(this.options);
    if (this.options.pushResult) return res;
  }
}

module.exports = Update;