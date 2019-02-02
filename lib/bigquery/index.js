const Streamz = require('streamz');

function insert(table, options) {
  options = options || {};

  let cols = (async () => {
    var metadata = await table.getMetadata();
    cols = metadata[0].schema.fields.map(d => d.name);
    return cols;
  })();

  return Streamz(options.concurrency, async d => {
    await cols;
    const data = [].concat(d).map(d => {
      return cols.reduce( (p,col) => {
        if (d[col] !== undefined) p[col] = d[col];
        return p;
      },{});
    });
    await table.insert(data);  
  });
}

module.exports = {insert};