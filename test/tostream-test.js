var etl = require('../index'),
    assert = require('assert');


describe('toStream',function() {
  it('starts a stream using supplied data',function() {
    return etl.toStream([1,2,[3,4]])
      .pipe(etl.map(function(d) {
        return [d];
      }))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[[1],[2],[[3,4]]]);
      });
  });

  it('with no data is an empty stream',function() {
    return etl.toStream()
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[]);
      });
  });
    
});