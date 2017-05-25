const duplexer2 = require('duplexer2');
const Streamz = require('streamz');
const toStream = require('./tostream');

module.exports = function(fn) {
  const inStream = Streamz();
  const outStream = Streamz();

  if (fn.length > 1)
    fn(inStream,outStream);
  else
    toStream(fn(inStream)).pipe(outStream);

  const stream = duplexer2({objectMode: true},inStream,outStream);

  // Mirror error and promise behaviour from streamz
  stream.on('error',e => {
    if (stream._events.error.length < 2) {
      const pipes = stream._readableState.pipes;
      if (pipes)
        [].concat(pipes).forEach(child => child.emit('error',e));
      else
        throw e;
    }
  });

  stream.promise = Streamz.prototype.promise;

  return stream;
};