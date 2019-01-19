const wrap = require('../wrap');

module.exports = {
  postgres : wrap(require('./postgres')),
  script : wrap(require('./script')),
  execute : wrap(require('./execute')),
  upsert : require('./upsert')
};