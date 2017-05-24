const Streamz = require('streamz');
const Promise = require('bluebird');

function toStream(data) {
  const stream = Streamz();

  if (typeof data == 'function')
    data = Promise.try(data.bind(stream));

  Promise.resolve(data)
    .then(d => {
      if (d && typeof d.pipe == 'function')
        return d.pipe(stream);
      else if (d !== undefined)
        [].concat(d).forEach(d => stream.write(d));
      stream.end();
    })
    .catch(e => stream.emit('error',e));

  return stream;
}

module.exports = toStream;