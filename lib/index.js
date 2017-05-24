const Streamz = require('streamz');

module.exports = {
  collect : require('./collect'),
  timeout : require('./timeout'),
  cut : require('./cut'),
  file : require('./file'),
  fixed : require('./fixed'),
  csv_parser : require('./csv_parser'),
  csv: require('./csv_parser'),
  split : require('./split'),
  expand : require('./expand'),
  stringify : require('./stringify'),
  inspect : require('./inspect'),
  mongo : require('./mongo'),
  mysql : require('./mysql'),
  postgres : require('./postgres'),
  elastic : require('./elasticsearch'),
  cluster : require('./cluster'),
  chain : require('./chain'),
  toStream : require('./tostream'),
  toFile : require('./toFile'),
  map : Streamz,
  keepOpen: require('./keepOpen'),
  prescan: require('./prescan'),
  streamz : Streamz
};
