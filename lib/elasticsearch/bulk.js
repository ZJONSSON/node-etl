var Streamz = require('streamz'),
    Promise = require('bluebird'),
    util = require('util');

function Bulk(action,client,index,type,options) {
  if (!(this instanceof Bulk))
    return new Bulk(action,client,index,type,options);

  if (!client)
    throw 'CLIENT_MISSING';

  if (!action)
    throw 'ACTION_MISSING';

  Streamz.call(this,options);
  this.options = options || {};
  this.action = action;
  this.index = index;
  this.type = type;
  this.client = client;
}

util.inherits(Bulk,Streamz);

Bulk.prototype.getMeta = function(id) {
  var obj = {},
      self=this,
      action = self.action == 'upsert' ? 'update' : self.action;

  obj[action] = {
    _id : id
  };
  return obj;
};

Bulk.prototype._fn = function(d) {
  var self = this;

  var data = [].concat(d).reduce(function(p,d) {
    if (self.action == 'custom') {
      var body = d.body;
      delete d.body;
      p.push(d);
      if (body)
        p.push(body);
      return p;
    }

    p.push(self.getMeta(d._id));
    delete d._id;

    if (self.action == 'index')
      p.push(d);
    else if (self.action == 'upsert')
      p.push({doc:d,doc_as_upsert:true});
    else if(self.action == 'update')
      p.push({doc:d});
    return p;
  },[]);

  return Promise.fromNode(function(cb) {
    self.client.bulk({
      body : data,
      index : self.index,
      type : self.type
    },cb);
  })
  .then(function(d) {
    return self.options.pushResult && d;
  });
};

module.exports = Bulk;