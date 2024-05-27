const PassThrough = require('stream').PassThrough;

module.exports = function dataStream(data) {
  const s = PassThrough({objectMode:true});
  // Simulate async data stream
  Promise.resolve().then(async() => {
    for (let i = 0; i < data.length; i++) {
      s.write(data[i]);
      await new Promise(resolve => setTimeout(resolve,10))
    }
    s.end();
  });
  return s;
};