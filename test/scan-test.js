var etl = require('../index'),
    PassThrough = require('stream').PassThrough,
    assert = require('assert');

var data = [1,2,3,4,5,6,7,8,9,10,11];

var expected = [
    [1,2,3],
    [4,5,6],
    [7,8,9],
    [10,11]
  ];

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
  
describe('chain',function() {
  it('works when returning a stream',function() {

    return dataStream()
      .pipe(etl.chain(function(stream) {
        return stream
          .pipe(etl.collect(3));
      }))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,expected);
      });
  });
});