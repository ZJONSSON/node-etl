const PassThrough = require('stream').PassThrough;

module.exports = function dataStream(data) {
  const s = PassThrough({objectMode:true});
  data.forEach((d,i) => setTimeout( () => {
    s.write(d);
    if (i == data.length-1)
      s.end();
  },i));
  return s;
};