var etl = require('../index'),
    assert = require('assert'),
    data = require('./data');

describe('fixed layout',function() {
  describe('defined as object',function() {
    it('splits incoming data into columns',function() {
      var fixed = etl.fixed(data.layout);

      return data.stream()
        .pipe(fixed)
        .pipe(etl.expand())
        .promise()
        .then(function(d) {
          assert.deepEqual(d,data.data);
        });
    });
  });
  describe('defined as an array',function() {
    it('splits infomcing data into columns',function() {
      var layout = Object.keys(data.layout).map(function(key) {
        var val = data.layout[key];
        if (!isNaN(val)) val = {length:val};
        val.field = key;
        return val;
      });

      var fixed = etl.fixed(layout);

      return data.stream()
        .pipe(fixed)
        .pipe(etl.expand())
        .promise()
        .then(function(d) {
          assert.deepEqual(d,data.data);
        });
    });
  });
});