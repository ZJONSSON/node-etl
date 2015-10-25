var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    data = require('./data');

describe('fixed layout',function() {
  it('splits incoming data into columns',function() {
    var fixed = etl.fixed(data.layout);

    data.getData().pipe(fixed);
    
    return inspect(fixed.pipe(etl.expand()))
      .then(function(d) {
        assert.deepEqual(d,data.data);
      });
  });
});