const Streamz = require('streamz');
const chain = require('./chain');
const fs = require('fs');

function toFile(filename) {  
  return chain(inStream => {
    const stream = Streamz();

    inStream
      .pipe(fs.createWriteStream(filename))
      .on('error',e => stream.emit('error',e))
      .on('finish',() => stream.end(true));

    return stream;
  });
}

module.exports = toFile;