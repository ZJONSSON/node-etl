const chain = require('../chain');
const streamz = require('streamz');

function insert(table, options) {
  let cols;
  options = options || {};

  return chain(incoming => incoming
    .pipe(streamz(options.concurrency, async d => {
      if (!cols) {
        var metadata = await table.getMetadata();
        cols = metadata[0].schema.fields.map(d => d.name);
      }
      const data = [].concat(d).map(d => {
        return cols.reduce( (p,col) => {
          if (d[col] !== undefined) p[col] = d[col];
          return p;
        },{});
      });
      await table.insert(data);  
    })));
}

module.exports = {insert};