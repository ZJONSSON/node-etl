const Streamz = require('streamz');
const Promise = require('bluebird');
const util = require('util');

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
  const res = {};
  const action = this.action == 'upsert' ? 'update' : this.action;
  const obj = res[action] = {
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

  if (!this.parent) {
    obj.parent = d.parent;
    delete d.parent;
  }

  if (!this.routing) {
    obj.routing = d.routing;
    delete d.routing;
  }

  return res;
};

Bulk.prototype._fn = function(d) {
  const data = [].concat(d).reduce((p,d) => {
    if (this.action == 'custom') {
      const body = d.body;
      delete d.body;
      p.push(d);
      if (body)
        p.push(body);
      return p;
    }

    p.push(this.getMeta(d));
    
    d = d._source || d;

    if (this.action == 'index')
      p.push(d);
    else if (this.action == 'upsert')
      p.push({doc:d,doc_as_upsert:true});
    else if(this.action == 'update')
      p.push({doc:d});
    return p;
  },[]);

  const execute = retry => {
    return this.client.bulk({
      body : data,
      index : this.index,
      type : this.type,
      consistency : this.options.consistency,
      refresh : this.options.refresh,
      routing : this.options.routing,
      timeout : this.options.timeout,
      fields : this.options.fields
    })
    .then(e => {
      if (!this.options.pushResult && !this.options.pushErrors)
        return;

      // Insert a copy of the original body
      e.items.forEach((e,i) =>e.body = d[i]);

      if (this.options.pushResults) 
        return e;

      const items = e.items.filter(d => {
        const verb = d.update || d.index || d.create;
        d.error = verb.error;
        return verb.status !== 201 && verb.status !== 200;
      });
      return items.length && items || undefined;
    },e => {
      retry = (retry || 0);
      if (!this.options.maxRetries || retry > this.options.maxRetries)
        throw e;
      if (this.options.debug)
        console.log('Retry',e.message);
      return Promise.delay(this.options.retryDelay || 30000)
        .then(execute.bind(this,retry++));
    });
  };

  return execute();
};

module.exports = Bulk;
