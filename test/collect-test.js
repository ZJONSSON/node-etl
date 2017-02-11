var etl = require('../index'),
    Promise = require('bluebird'),
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

  describe('with maxDuration',function() {
    it('pushes on timeouts',function() {
      return etl.toStream([1,2,3,4,5,6,7,8,9,10])
        .pipe(etl.map(function(d) {
          return Promise.delay(50)
            .then(function() {
              return d;
            });
        }))
        .pipe(etl.collect(5,150))
        .promise()
        .then(function(d) {
          assert.deepEqual(d,[[1,2,3],[4,5,6],[7,8,9],[10]]);
        });
    });
  });

  describe('with maxTextLength',function() {
    it('pushes when text reaches max',function() {
      var data = [
        {text:'test'},
        {text:'test'},
        {text:'this is a really long string'},
        {text:'test'}
      ];

      return etl.toStream(data)
        .pipe(etl.collect(1000,1000,15))
        .promise()
        .then(function(d) {
          assert.deepEqual(d,[
            [data[0],data[1]],
            [data[2]],
            [data[3]]
          ]);
        });
    });
  });

  describe('custom function',function() {
    it('runs and flush pushes remaining buffer',function() {

      var expected = [
        [1,2,3],
        [4,5,6],
        [7,8,9,10,11]
      ];

      return dataStream()
        .pipe(etl.collect(function(d) {
          this.buffer.push(d);
          if (d < 7 && this.buffer.length > 2)
            this._push();
        }))
        .promise()
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });


});