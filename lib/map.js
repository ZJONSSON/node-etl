var Streamz = require('streamz'),
    util = require('util');

function Map(layout) {
  if (!(this instanceof Map))
    return new Map(layout);
  Streamz.call(this);
  this.layout = layout;
}

util.inherits(Map,Streamz);

Map.prototype._fn = function(line) {
  var layout = this.layout;

  if (typeof layout === 'function')
    return layout(line);
  else 
    return Object.keys(layout).reduce(function(p,key) {
      p[key] = line[layout[key]];
      return p;
    },{});
};

module.exports = Map;