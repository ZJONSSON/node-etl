var streamz = require('streamz');

module.exports = {
  collect : require('./lib/collect'),
  file : require('./lib/file'),
  fixed : require('./lib/fixed'),
  split : require('./lib/split'),
  expand : require('./lib/expand'),
  stringify : require('./lib/stringify'),
  map : require('./lib/map'),
  streamz : streamz
};