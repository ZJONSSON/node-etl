const Streamz = require('streamz');
class Expand extends Streamz {
  constructor(convert) {
    super();
    if (convert == 'uppercase')
      this.convert = function(d) {
        return String(d).toUpperCase();
      };

    else if (convert == 'lowercase')
      this.convert = function(d) {
        return String(d).toLowerCase();
      };

    else
      this.convert = convert;
  }

  expand(d) {
    for (let key in d) {
      const oldKey = key;
      if (typeof this.convert === 'function')
        key = this.convert(key);

      if (key) {
        if (typeof d[key] === 'object')
          d[key] = this.expand(d[oldKey]);
        else
          d[key] = d[oldKey];
        if (oldKey !== key)
          delete d[oldKey];
      } else
        delete d[oldKey];
    }
    return d;
  }

  _fn (d) {
    return this.expand(Object.create(d));
  }
}


module.exports = Expand;