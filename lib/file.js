const fs = require('fs');
const util = require('util');
const Streamz = require('streamz');

function File(file,options) {
  if (!(this instanceof File))
    return new File(file,options);

  Streamz.call(this);

  options = options || {};
  if (options.encoding === undefined)
    options.encoding = 'utf-8';

  fs.createReadStream(file,options)
    .pipe(this);

  let filename = file.split('/');
  filename = filename[filename.length-1];

  this.info = options.info || {};
  this.info.__path = file;
  this.info.__filename = filename;
}

util.inherits(File,Streamz);

File.prototype._fn = function(d) {
  const obj = Object.create(this.info);
  obj.text = d;
  this.push(obj);
};

module.exports = File;