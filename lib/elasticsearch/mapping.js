function parse(obj,path,res) {
  path = path || [];
  res = res || {};

  if (obj.field)
    res[obj.field] = {path:path,type:obj.type};
  
  if(obj.properties) {
    Object.keys(obj.properties).forEach(key => {
      parse(obj.properties[key],path.concat(key),res);
    });
  }
  return res;
}

function populate(map,src) {
  const obj = {};

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

  Object.keys(map).forEach(key => {
    let value = src[key];
    if (!isNaN(value) && (map[key].type == 'long' || map[key].type == 'float'))
      value = Number(value);
    if (value !== undefined)
      setValue(map[key].path,obj,value);
  });
  return obj;
}


module.exports = {
  parse : parse,
  populate : populate
};