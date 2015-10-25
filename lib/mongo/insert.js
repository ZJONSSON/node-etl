var Streamz = require('streamz'),
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
  this.collection = collection;
  this.options = options || {};
  
}

util.inherits(Insert,Streamz);

Insert.prototype._fn = function(d,cb) {
  var self = this;
  this.collection.insert(d,this.options,function(err,d) {
    if (err) return cb(err);
    if (self.options.pushResult)
      self.push(d.result);
    cb(null,d);
  });
};

module.exports = Insert;