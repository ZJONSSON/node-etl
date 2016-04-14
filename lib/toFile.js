var Streamz = require('streamz'),
    chain = require('./chain'),
    fs = require('fs');

function toFile(filename) {  
  return chain(function(input) {
    var stream = Streamz();

    input
      .pipe(fs.createWriteStream(filename))
      .on('error',function(e) { stream.emit('error',e);})
      .on('finish',function() {
        stream.end(true);
      });

    return stream;
  });
}

module.exports = toFile;