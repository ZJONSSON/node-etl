const { Readable } = require('stream');

class Scroll extends Readable {
  constructor(client,query,options) {
    super(Object.assign({},options,{objectMode: true}));

    options = options || {};
    options.objectMode = true;
    
    query.scroll = query.scroll || '10s';

    this.client = client;
    this.query = query;
    this.options = options;
    this.buffer = [];
  }
  
  async _read() {
    let paused;

    if (this.search)
      return;

    if (!this.scroll_id) 
      this.search = this.client.search(this.query);
    else
      this.search = this.client.scroll({scroll_id: this.scroll_id, scroll: this.query.scroll});
      
    const d = await this.search;
    try {
      this.search = undefined;
      this.scroll_id = this.scroll_id || d._scroll_id;
      
      if (!d.hits.hits.length) {
        this.scroll_id = undefined;
        return this.push(null);
      }
      
      d.hits.hits.forEach(d => paused = !this.push(d));

      if (!paused)
        return this._read();
    } catch(e) {
      this.emit('error',e);
    }
  }
}

module.exports = Scroll;