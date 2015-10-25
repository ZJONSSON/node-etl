var Streamz = require('streamz'),
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

  Streamz.call(this,_c);
  this.collection = collection;
  this.options = options || {};
  this.keys = keys;
}

util.inherits(Update,Streamz);

Update.prototype._fn = function(d,cb) {
  var self = this;
  var criteria = this.keys.reduce(function(p,key) {
    p[key] = d[key];
    return p;
  },{});

  this.collection.update(criteria,{$set:d},this.options,function(err,d) {
    if (err) return cb(err);
    if (self.options.pushResult)
      self.push(d.result);
    cb(null,d);
  });
};

module.exports = Update;