var Streamz = require('streamz'),
    Promise = require('bluebird'),
    util = require('util');

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

Update.prototype._fn = function(d,cb) {
  var self = this;

  this.collection
    .then(function(collection) {
      var bulk = collection.initializeUnorderedBulkOp();

      [].concat(d || []).forEach(function(d) {
        var criteria = self.keys.reduce(function(p,key) {
          if (d[key] === undefined)
            throw new Error('Key not found in data');
          p[key] = d[key];
          delete d[key];
          return p;
        },{});

        var op = bulk.find(criteria);

        if (self.options.upsert)
          op = op.upsert();

        op.updateOne({$set:d});
      });

      bulk.execute(self.options,function(err,d) {
        cb(err,self.options.pushResult && d);
      });
    });
};

module.exports = Update;