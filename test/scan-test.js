var etl = require('../index'),
    PassThrough = require('stream').PassThrough,
    assert = require('assert'),
    Promise = require('bluebird');

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
  
describe('prescan',function() {
  it('works with a stream of objects',function() {
    var prescanned;
    return dataStream()
      .pipe(etl.prescan(3,function(d) {
        return Promise.delay(500)
          .then(function() {
            assert.deepEqual(d,[1,2,3]);
            prescanned = true;
          });
      }))
      .pipe(etl.map(function(d) {
        assert(prescanned);
        return d;
      }))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,data);
      });
  });

  it('works when requested size is larger than actual',function() {
    var prescanned;
    return dataStream()
      .pipe(etl.prescan(100,function(d) {
        assert.deepEqual(d,data);
        prescanned = true;
      }))
      .pipe(etl.map(function(d) {
        assert(prescanned);
        return d;
      }))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,data);
      });
  });

  it('works with a string',function() {
    var text = [
      'Lorem ipsum dolor sit amet, ',
      'consectetur adipiscing elit, ',
      'sed do eiusmod tempor incididunt ',
      'ut labore et dolore magna aliqua.' 
    ];

    var prescanned;
    return etl.toStream(Promise.map(text,function(d,i) {
        return Promise.delay(i*10).then(function() {
          return d;
        });
      }))
      .pipe(etl.prescan(30,function(d) {
        return Promise.delay(500)
          .then(function() {
            assert.deepEqual(d, text.slice(0,2));
            prescanned = true;
          });
      }))
      .pipe(etl.map(function(d) {
        assert(prescanned);
        return d;
      }))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,text);
      });
  });
});