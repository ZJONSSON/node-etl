const Streamz = require('streamz');
const Csv = require('csv-parser');

class CsvParser extends Streamz {
  constructor(options) {
    super(options);
    this.options = options = options || {};
    this.options.transform = options.transform || {};
    this.csv = Csv(options);

    const _compile = this.csv._compile;
    const self = this;

    this.csv._compile = function() {
      if (options.sanitize)
        this.headers = this.headers.map(header => String(header)
          .trim()
          .toLowerCase()
          .replace(/\./g,'')
          .replace(/\'/g,'')
          .replace(/\s+/g,'_')
          .replace(/\u2013|\u2014/g, '-')
          .replace(/\//g,'_')
        );
          
      self.emit('headers',this.headers);
      return _compile.call(this);
    };
    this.csv.on('data',data => this._push(data));
    this.base = {};
    this.line = 1;
  }

  _fn(d) { 
    if (d instanceof Buffer || typeof d !== 'object')
      d = Object.create({},{
        // text should be non-enumerable
        text: {
          value: d.toString('utf8'),
          writable: true,
          configurable: true
        } 
      });
    if (typeof d === 'object')
      this.base = d;
    this.csv.write(d.text || d);
  }

  _push(d) {
    const obj = Object.create(this.base);
    for (let key in d) {
      if (this.options.sanitize && typeof d[key] === 'string' && !d[key].trim().length) {
        d[key] = undefined;
      } else {
        const transform = this.options.transform[key];
        if (typeof transform === 'function')
          obj[key] = transform(d[key]);
        else if (transform !== null)
          obj[key] = d[key];
      }
    }
    obj.__line = ++this.line;
    this.push(obj);
  }

  _flush(cb) {
    this.csv.end();
    setImmediate( () => Streamz.prototype._flush(cb));
  }
}

module.exports = CsvParser;