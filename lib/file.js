const fs = require('fs');
const Streamz = require('streamz');

class File extends Streamz {
  constructor(file,options) {
    super();

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
  _fn(d) {
    const obj = Object.create(this.info);
    obj.text = d;
    this.push(obj);
  }
}

module.exports = File;