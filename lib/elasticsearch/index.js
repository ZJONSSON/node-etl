const bulk = require('./bulk');
const wrap = require('../wrap');

function bulkWrap(verb) {
  return function() {
    return new bulk(...[verb].concat([...arguments]));
  };
}

module.exports = {
  bulk : wrap(bulk),
  custom : bulkWrap('custom'),
  index : bulkWrap('index'),
  update : bulkWrap('update'),
  upsert : bulkWrap('upsert'),
  delete : bulkWrap('delete'),
  find : wrap(require('./find')),
  mapping : require('./mapping'),
  scroll : wrap(require('./scroll'))
};