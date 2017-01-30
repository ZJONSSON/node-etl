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
  if (this.options.pushResult)  // legacy fix
    this.options.pushResults = this.options.pushResult;
  this.action = action;
  this.index = index;
  this.type = type;
  this.client = client;
}

util.inherits(Bulk,Streamz);

Bulk.prototype.getMeta = function(d) {
  var res = {},
      self=this,
      action = self.action == 'upsert' ? 'update' : self.action;

  var obj = res[action] = {
    _id : d._id,
  };
  delete d._id;

  if (!this.index) {
    obj._index = d._index;
    delete d._index;
  }

  if (!this.type) {
    obj._type = d._type;
    delete d._type;
  }

  return res;
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

    p.push(self.getMeta(d));
    
    d = d._source || d;

    if (self.action == 'index')
      p.push(d);
    else if (self.action == 'upsert')
      p.push({doc:d,doc_as_upsert:true});
    else if(self.action == 'update')
      p.push({doc:d});
    return p;
  },[]);

  function execute(retry) {
    return self.client.bulk({
      body : data,
      index : self.index,
      type : self.type,
      consistency : self.options.consistency,
      refresh : self.options.refresh,
      routing : self.options.routing,
      timeout : self.options.timeout,
      fields : self.options.fields
    })
    .then(function(e) {
      if (!self.options.pushResult && !self.options.pushErrors)
        return;

      // Insert a copy of the original body
      e.items.forEach(function(e,i) {
        e.body = d[i];
      });

      if (self.options.pushResults) 
        return e;

      var items = e.items.filter(function(d) {
        var verb = d.update || d.index || d.create;
        d.error = verb.error;
        return verb.status !== 201 && verb.status !== 200;
      });
      return items.length && items || undefined;
    },function(e) {
      retry = (retry || 0);
      if (!self.options.maxRetries || retry > self.options.maxRetries)
        throw e;
      if (self.options.debug)
        console.log('Retry',e.message);
      return Promise.delay(self.options.retryDelay || 30000)
        .then(execute.bind(self,retry++));
    });
  }

  return execute();
};

module.exports = Bulk;