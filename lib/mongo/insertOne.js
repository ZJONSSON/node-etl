const Streamz = require('streamz');
const Promise = require('bluebird');
const util = require('util');

function insertOne(_c,collection,options) {
  if (!(this instanceof Streamz))
    return new insertOne(_c,collection);

  if (isNaN(_c)) {
    options = collection;
    collection = _c;
    _c = undefined;
  }

  Streamz.call(this, _c, null, options);
  this.collection = Promise.resolve(collection);
  this.options = options || {};
}

util.inherits(insertOne,Streamz);

insertOne.prototype._fn = function(d) {
  return this.collection
    .then(collection =>collection.insertOne(d,this.options))
    .then(d => {
      if (this.options.pushResults)
        return d.result;
    });
};

module.exports = insertOne;