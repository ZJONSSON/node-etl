const Streamz = require('streamz');
const wrap = require('./wrap');

module.exports = {
  collect : wrap(require('./collect')),
  timeout : wrap(require('./timeout')),
  cut : require('./cut'),
  file : wrap(require('./file')),
  fixed : wrap(require('./fixed')),
  csv_parser : wrap(require('./csv_parser')),
  csv: wrap(require('./csv_parser')),
  split : wrap(require('./split')),
  expand : wrap(require('./expand')),
  stringify : wrap(require('./stringify')),
  inspect : wrap(require('./inspect')),
  mongo : require('./mongo'),
  mysql : require('./mysql'),
  postgres : require('./postgres'),
  elastic : require('./elasticsearch'),
  cluster : require('./cluster'),
  chain : require('./chain'),
  toStream : require('./tostream'),
  toFile : require('./toFile'),
  map : Streamz,
  keepOpen: wrap(require('./keepOpen')),
  prescan: wrap(require('./prescan')),
  bigquery: require('./bigquery'),
  streamz : Streamz
};
