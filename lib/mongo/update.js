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
  this.options.pushResults = this.options.pushResults || this.options.pushResult; // legacy
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
          return p;
        },{});

        let op = bulk.find(criteria);

        if (this.options.upsert)
          op = op.upsert();

        let payload = (d.$set || d.$addToSet) ? d : {$set: d};
        if (d.$update) payload = d.$update;

        op.updateOne(payload);
      });

      return bulk.execute(this.options.writeConcern);
    })
    .then(d => {
      if (this.options.pushResults)
        return d;
    });
    
};

module.exports = Update;