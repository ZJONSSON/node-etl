const Streamz = require('streamz');

class Find extends Streamz {
  constructor(client,options) {
    super(options);
    if (!client)
      throw 'CLIENT_MISSING';
    this.client = client;
  }

  search(d) {
    return this.client.search(d);
  }
  
  async _fn(query) {
    let d = await this.search(query);
    d.hits.hits.forEach(d => {
      d._search = query;
      this.push(d);
    });
  }
}

module.exports = Find;