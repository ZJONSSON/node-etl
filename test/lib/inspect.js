var streamz = require('streamz'),
    Promise = require('bluebird');

// Inspects the cumulative results of a stream
module.exports = function(stream) {
  var res = [];
  return new Promise(function(resolve,reject) {
    stream.pipe(streamz(function(d) {
      res.push(d);
    }))
    .on('error',function(e) {
      reject(e);
    })
    .on('finish',function() {
      resolve(res);
    });
  });
};