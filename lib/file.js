var fs = require('fs'),
    util = require('util'),
    Streamz = require('streamz');

function File(path,options) {
  if (!(this instanceof File))
    return new File(path,options);

  Streamz.call(this);

  fs.createReadStream(path,options)
    .pipe(this);

  this.__path = path;
  path = path.split('/');
  this.__filename = path[path.length-1];
}

util.inherits(File,Streamz);

File.prototype._fn = function(d) {
  this.push({
    text: d,
    __path : this.__path,
    __filename: this.__filename
  });
};

module.exports = File;