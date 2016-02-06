var etl = require('../index'),
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

      return dataStream()
        .pipe(etl.collect(3))
        .promise()
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });

  describe('x=9999',function() {
    it('returns everything in an array',function() {
      var expected = [data];

      return dataStream()
        .pipe(etl.collect(9999))
        .promise()
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

      return dataStream()
        .pipe(etl.collect(1))
        .promise()
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });
});