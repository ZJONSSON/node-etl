var Streamz = require('streamz'),
    Promise = require('bluebird'),
    util = require('util');

function Insert(_c,collection,options) {
  if (!(this instanceof Streamz))
    return new Insert(_c,collection);

  if (isNaN(_c)) {
    options = collection;
    collection = _c;
    _c = undefined;
  }

  Streamz.call(this, _c, null, options);
  this.collection = Promise.resolve(collection);
  this.options = options || {};
  
}

util.inherits(Insert,Streamz);

Insert.prototype._fn = function(d) {
  var self = this;
  return this.collection
    .then(function(collection) {
      return collection.insert(d,self.options);
    })
    .then(function(d) {
      if (self.options.pushResults)
        return d.result;
    });
};

module.exports = Insert;