var etl = require('../index'),
    assert = require('assert'),
    Promise = require('bluebird');

describe('timeout',function() {
  describe('with no delay',function() {
    var timeout = etl.timeout(100);

    it('doesnt emit timeout',function() {
      return etl.toStream([1,2,3,4])
      .pipe(etl.map(function(d) {
        return Promise.delay(30,d);
      }))
      .pipe(timeout)
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[1,2,3,4]);
      });
    });

    it('cleans up the setInterval',function() {
      assert.equal(timeout.interval._idleTimeout,-1);
    });

  });

  describe('with a triggering delay',function() {
    var timeout = etl.timeout(100);

    it('emits timeout when delayed',function() {
      return etl.toStream([1,2,3,4])
        .pipe(etl.map(function(d) {
          // Delay by 250ms when we see '4'
          return Promise.delay(d === 4 ? 250 : 30,d);
        }))
        .pipe(timeout)
        .promise()
        .then(function() {
          throw 'SHOULD_ERROR';
        },function(e) {
          assert.equal(e,'ETL_TIMEOUT');
        });
    });

    it('cleans up the setInterval',function() {
      assert.equal(timeout.interval._idleTimeout,-1);
    });

  });
});