const Streamz = require('streamz');
const Promise = require('bluebird');
const util = require('util');

function Update(_c,collection,keys,options) {
  if (!(this instanceof Streamz))
    return new Update(_c,collection,keys,options);

  if (isNaN(_c)) {
    options = keys;
    keys = collection;
    collection = _c;
    _c = undefined;
  }

  if (keys === undefined)
    throw new Error('Missing Keys');

  Streamz.call(this, _c, null, options);
  this.collection = Promise.resolve(collection);
  this.options = options || {};
  this.keys = [].concat(keys);
}

util.inherits(Update,Streamz);

Update.prototype._fn = function(d) {
  return this.collection
    .then(collection => {
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

      return bulk.execute(this.options);
    })
    .then(d => {
      if (this.options.pushResult)
        return d;
    });
    
};

module.exports = Update;