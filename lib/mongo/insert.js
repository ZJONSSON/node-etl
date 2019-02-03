const Streamz = require('streamz');
const Promise = require('bluebird');

class Insert extends Streamz {
  constructor(_c,collection,options) {
    super(_c, null, options);
    if (isNaN(_c)) {
      options = collection;
      collection = _c;
      _c = undefined;
    }

    this.collection = Promise.resolve(collection);
    this.options = options || {};
  }

  async _fn(d) {
    const collection = await this.collection;
    const res = await collection.insert(d,this.options);
    if (this.options.pushResults) return res.result;
  }
}

module.exports = Insert;