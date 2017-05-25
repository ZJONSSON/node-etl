const Readable = require('stream').Readable;
const util = require('util');

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
  let paused;

  if (this.search)
    return;

  if (!this.scroll_id) 
    this.search = this.client.search(this.query);
  else
    this.search = this.client.scroll({scroll_id: this.scroll_id, scroll: this.query.scroll});
    
  return this.search
    .then(d => {
      this.search = undefined;
      this.scroll_id = this.scroll_id || d._scroll_id;
      
      if (!d.hits.hits.length) {
        this.scroll_id = undefined;
        return this.push(null);
      }
      
      d.hits.hits.forEach(d => paused = !this.push(d));

      if (!paused)
        return this._read();
    })
    .catch(e => this.emit('error',e));
};

module.exports = Scroll;