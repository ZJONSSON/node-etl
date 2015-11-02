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
  if (this.next || this.scroll_id === null)
    return;

  var self = this;

  if (!this.scroll_id)
    this.next = this.client.search(this.query);
  else {
    this.next = this.client.scroll({scroll_id:this.scroll_id,scroll:this.query.scroll});
  }
    
  return this.next
    .then(function(d) {
      self.next = undefined;
      self.scroll_id = self.scroll_id || d._scroll_id;
      
      if (!d.hits.hits.length)
        self.push(null);
      else {
        d.hits.hits.forEach(function(d) {
          self.push(d);
        });
      }
    });
};



module.exports = Scroll;