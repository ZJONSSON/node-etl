var Streamz = require('streamz'),
    util = require('util');

function Find(client,options) {
  if (!(this instanceof Find))
    return new Find(client);

  if (!client)
    throw 'CLIENT_MISSING';

  Streamz.call(this,options);
  this.client = client;
}

util.inherits(Find,Streamz);

Find.prototype.search = function(d) {
  return this.client.search(d);
};

Find.prototype._fn = function(query) {
  var self = this;
  return this.search(query)
    .then(function(d) {
      d.hits.hits.forEach(function(d) {
        d._search = query;
        self.push(d);
      });
    });
};

module.exports = Find;