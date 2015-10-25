var etl = require('../index'),
    inspect = require('./lib/inspect'),
    PassThrough = require('stream').PassThrough,
    assert = require('assert');

var data = [1,2,3,4,5,6,7,8,9,10,11];

function dataStream() {
  var s = PassThrough({objectMode:true});
  data.forEach(function(d,i) {
    setTimeout(function() {
      s.write(d);
      if (i == data.length-1)
        s.end();
    });
  });
  return s;
}
  
describe('collect',function() {
  describe('x=3',function() {
    it('collects 3 at a time',function() {

      var expected = [
        [1,2,3],
        [4,5,6],
        [7,8,9],
        [10,11]
      ];

      var collect = etl.collect(3);

      dataStream().pipe(collect);
    
      return inspect(collect)
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });

  describe('x=9999',function() {
    it('returns everything in an array',function() {
      var expected = [data];

      var collect = etl.collect(9999);

      dataStream().pipe(collect);

      return inspect(collect)
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });

  describe('x=1',function() {
    it('returns array of one element arrays',function() {
      var expected = data.map(function(d) {
        return [d];
      });

      var collect = etl.collect(1);

      dataStream().pipe(collect);

      return inspect(collect)
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });
});