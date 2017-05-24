const Streamz = require('streamz');
const util = require('util');

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
  return this.search(query)
    .then(d => d.hits.hits.forEach(d => {
      d._search = query;
      this.push(d);
    }));
};

module.exports = Find;