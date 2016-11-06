var etl = require('../index'),
    assert = require('assert'),
    Promise = require('bluebird');

describe('keepOpen',function() {
  it('stays open after end as long as data arrives before timeout',function() {
    var p = etl.keepOpen(500);

    return etl.toStream([1,999,[3,4]])
      .pipe(p)
      .pipe(etl.map(function(d) {
        if (d === 999)
          Promise.delay(200)
           .then(p.write.bind(p,2));
        else
          return d;
      }))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[1,[3,4],2]);
      });
  });

  it('errors `write after end` if data arrives after timeout',function() {
    var p = etl.keepOpen(100);

    return etl.toStream([1,undefined,[3,4]])
      .pipe(p)
      .pipe(etl.map(function(d) {
        if (d === undefined)
          return Promise.delay(1000)
           .then(p.write.bind(p,2));
          
        else
          return d;
      }))
      .promise()
      .then(function() {
        throw 'Should Error';
      },function(e) {
        assert(e.message === 'stream.push() after EOF' || e.message === 'write after end',e.message);
      });
  });

  
});