const Streamz = require('streamz');
const util = require('util');

function Fixed(layout,options) {
  if (!(this instanceof Fixed))
    return new Fixed(layout,options);

  Streamz.call(this);

  this.options = options || {};

  let n = 0;

  // If the layout is an array, we reduce to an object
  if(layout.length)
    layout = layout.reduce((p,d) => {
      p[d.field] = d;
      return p;
    },{});

  // Take note of the record length by looking for last `end`
  this.recordLength = Object.keys(layout).reduce((p,key) => {
    if (!isNaN(layout[key]))
      layout[key] = { length: layout[key] };
    
    const item = layout[key];
    if (!item.start)
      item.start = n;
    if (!item.end)
      item.end = item.start + item.length;
    n = item.end || 0;
    return Math.max(p, n);
  },0);

  this.layout = layout;
}

util.inherits(Fixed,Streamz);

Fixed.prototype.__line = 0;

Fixed.prototype._push = function() {
  
  if (!this.buffer || this.buffer.text.length < this.recordLength)
    return;

  const layout = this.layout;

  const obj = Object.create(this.buffer);
  obj.text = obj.text.slice(0,this.recordLength);
  
  Object.keys(layout)
    .forEach(key => {
      const e = layout[key];
      let val = obj.text.slice(e.start,e.end || e.start + e.length).trim();
      if (!val.length)
        return;   
      if (e.transform)
        val = e.transform(val);
      if (val !== undefined)
        obj[key] = val;
    });

  if (this.options.clean)
    delete obj.text;
  else
    obj.__line = ++this.__line;

  this.push(obj);

  this.buffer.text = this.buffer.text.slice(this.recordLength);
  return this._push();
};

Fixed.prototype._fn = function(d) {

  if (d instanceof Buffer || typeof d !== 'object') {
    d = Object.create({},{
      // text should be non-enumerable
      text: {
        value: d.toString('utf8'),
        writable: true,
        configurable: true
      } 
    });
  }

  if (!this.buffer) {
    this.buffer = Object.create(!this.options.clean ? d : {});
    this.buffer.text = '';
  }

  this.buffer.text += d.text;
  this._push();
};

Fixed.prototype._flush = function(cb) {
  this._push();
  setImmediate( () => Streamz.prototype._flush(cb));
};

module.exports = Fixed;