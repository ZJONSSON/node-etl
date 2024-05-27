const Streamz = require('streamz');
const Promise = require('bluebird');
const util = require('util');

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

Insert.prototype._fn = function (d) {
  const operation = Array.isArray(d) ? 'insertMany' : 'insertOne';
  return this.collection
    .then(collection =>collection[operation](d,this.options))
    .then(d => {
      if (this.options.pushResults)
        return d;
    });
};

module.exports = Insert;