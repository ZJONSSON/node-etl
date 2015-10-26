var streamz = require('streamz');

module.exports = {
  collect : require('./collect'),
  file : require('./file'),
  fixed : require('./fixed'),
  csv_parser : require('./csv_parser'),
  split : require('./split'),
  expand : require('./expand'),
  stringify : require('./stringify'),
  inspect : require('./inspect'),
  mongo : require('./mongo'),
  mysql : require('./mysql'),
  elastic : require('./elasticsearch'),
  map : streamz,
  streamz : streamz
};