function parse(obj,path,res) {
  path = path || [];
  res = res || {};
  if (obj.type !== 'nested')
    if (obj.field)
      res[obj.field] = path;
  else if(obj.properties) {
    Object.keys(obj.properties).forEach(function(key) {
      parse(obj.properties[key],path.concat(key),res);
    });
  }
  return res;
}

function populate(map,src) {
  var obj = {};

  function setValue(path,o,val) {
    o = o || {};
    if (path.length == 1) {
      o[path[0]] = val;
      return o;
    } else {
      o[path[0]] = o[path[0]] || {};
      return setValue(path.slice(1),o[path[0]],val);
    }
  }

  Object.keys(map).forEach(function(key) {
    return setValue(map[key],obj,src[key]);
  });
  return obj;
}


module.exports = {
  parse : parse,
  populate : populate
};