var Readable = require('stream').Readable,
    util = require('util');

function Scroll(client,query,options) {
  if (!(this instanceof Scroll))
    return new Scroll(client,query,options);

  options = options || {};
  options.objectMode = true;
  Readable.call(this,options);

  query.scroll = query.scroll || '10s';

  this.client = client;
  this.query = query;
  this.options = options;
}

Scroll.prototype.buffer = [];

util.inherits(Scroll,Readable);

Scroll.prototype._read = function() {
  var self = this, paused;

  if (this.search)
    return;

  if (!this.scroll_id) 
    this.search = this.client.search(this.query);
  else
    this.search = this.client.scroll({scroll_id: this.scroll_id, scroll: this.query.scroll});
    
  return this.search
    .then(function(d) {
      self.search = undefined;
      self.scroll_id = self.scroll_id || d._scroll_id;
      
      if (!d.hits.hits.length) {
        self.scroll_id = undefined;
        return self.push(null);
      }
      
      d.hits.hits.forEach(function(d) {
        paused = !self.push(d);
      });
      if (!paused)
        return self._read();
    })
    .catch(function(e) {
      self.emit('error',e);
    });
};

module.exports = Scroll;