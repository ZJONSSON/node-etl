var Streamz = require('streamz');
var Promise = require('bluebird');

function toStream(data) {
  var stream = Streamz();

  if (typeof data == 'function')
    data = Promise.try(data.bind(stream));

  Promise.resolve(data)
    .then(function(d) {
      if (d && typeof d.pipe == 'function')
        return d.pipe(stream);
      else if (d !== undefined)
        [].concat(d).forEach(stream.write.bind(stream));
      stream.end();
    });

  return stream;
}

module.exports = toStream;