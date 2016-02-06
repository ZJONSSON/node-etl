var Streamz = require('streamz');

function toStream(data) {
  var stream = Streamz();
  if (data !== undefined)
    [].concat(data).forEach(stream.write.bind(stream));
  stream.end();
  return stream;
}

module.exports = toStream;