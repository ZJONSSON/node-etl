var streamz = require('streamz');

module.exports = {
  collect : require('./lib/collect'),
  file : require('./lib/file'),
  fixed : require('./lib/fixed'),
  split : require('./lib/split'),
  expand : require('./lib/expand'),
  stringify : require('./lib/stringify'),
  inspect : require('./lib/inspect'),
  map : require('./lib/map'),
  streamz : streamz
};