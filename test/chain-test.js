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
  
describe('chain',function() {
  it('pipes data through subchain',function() {

    var expected = [
      [1,2,3],
      [4,5,6],
      [7,8,9],
      [10,11]
    ];

    return dataStream()
      .pipe(etl.chain(function(stream) {
        return stream
          .pipe(etl.map())
          .pipe(etl.collect(3))
          .pipe(etl.map());
      }))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,expected);
      });
  });

  it('bubbles errors in subchain',function() {

    var chain = etl.map();

    setTimeout(function() {
      chain.end('test');
    });

    return chain
      .pipe(etl.map())
      .pipe(etl.chain(function(stream) {
        return stream
          .pipe(etl.map())
          .pipe(etl.map(function() {
            throw 'ERROR';
          }))
          .pipe(etl.collect(3))
          .pipe(etl.map());
      }))
      .promise()
      .then(function() {
        throw 'Should error';
      },function(e) {
        assert.equal(e,'ERROR');
      });
  });

});