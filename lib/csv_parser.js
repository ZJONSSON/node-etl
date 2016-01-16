var Streamz = require('streamz'),
    util = require('util'),
    Csv = require('csv-parser');

function Csv_parser(options) {
  if (!(this instanceof Streamz))
    return new Csv_parser(options);
  
  Streamz.call(this);
  
  this.options = options = options || {};
  this.options.transform = options.transform || {};
  this.csv = Csv(options);

  var _compile = this.csv._compile,
      self = this;

  this.csv._compile = function() {
    if (options.sanitize)
      this.headers = this.headers.map(function(header) {
        return String(header)
            .trim()
            .toLowerCase()
            .replace(/\./g,'')
            .replace(/\'/g,'')
            .replace(/\s+/g,'_')
            .replace(/\u2013|\u2014/g, '-')
            .replace(/\//g,'_');
        });
      self.emit('headers',this.headers);
      return _compile.call(this);
  };
  this.csv.on('data',this._push.bind(this));
}

util.inherits(Csv_parser,Streamz);

Csv_parser.prototype.base = {};

Csv_parser.prototype.line = 1;

Csv_parser.prototype._fn = function(d) { 
  if (d instanceof Buffer || typeof d !== 'object')
    d = {text: d.toString('utf8')};
  if (typeof d === 'object')
    this.base = d;
  this.csv.write(d.text || d);
};

Csv_parser.prototype._push = function(d) {
  var obj = Object.create(this.base);
  for (var key in d) {
    var transform = this.options.transform[key];
    if (typeof transform === 'function')
      obj[key] = transform(d[key]);
    else if (transform !== null)
      obj[key] = d[key];
  }
  obj.__line = ++this.line;
  this.push(obj);
};

Csv_parser.prototype._flush = function(cb) {
  var self = this;
  return Streamz.prototype._flush.call(this,function() {
    self.csv.end();
    setImmediate(cb);
  });
};

module.exports = Csv_parser;