const wrap = require('../wrap');

module.exports = {
  mysql : wrap(require('./mysql')),
  script : wrap(require('./script')),
  execute : wrap(require('./execute')),
  upsert : require('./upsert')
};