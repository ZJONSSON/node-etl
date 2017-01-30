var etl = require('../index'),
    assert = require('assert');

describe('toStream',function() {
  describe('static data',function() {
    it('streams supplied data',function() {
      return etl.toStream([1,2,[3,4]])
        .pipe(etl.map(function(d) {
          return [d];
        }))
        .promise()
        .then(function(d) {
          assert.deepEqual(d,[[1],[2],[[3,4]]]);
        });
    });

    it('no data returns empty stream',function() {
      return etl.toStream()
        .promise()
        .then(function(d) {
          assert.deepEqual(d,[]);
        });
    });
  });

  describe('function input',function() {
    it('streams the function results',function() {
      return etl.toStream(function() {
        return([1,2,[3,4]]);
      })
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[1,2,[3,4]]);
      });
    });

    it('streams `this.push` and function results',function() {
      return etl.toStream(function() {
        this.push(1);
        this.push(2);
        return [[3,4]]
      })
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[1,2,[3,4]]);
      });
    });

    it('no data returns empty stream',function() {
      return etl.toStream(function() {
      })
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[]);
      });
    });
  });

  describe('promise input',function() {
    it('streams the resolved values',function() {
      return etl.toStream(Promise.resolve([1,2,[3,4]]))
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[1,2,[3,4]]);
      });
    });

    it('no data returns empty stream',function() {
      return etl.toStream(Promise.resolve())
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[]);
      });
    });
  });

   describe('function returning a stream input',function() {
    it('streams the resolved values',function() {
      return etl.toStream(function() {
        return etl.toStream([1,2,[3,4]]);
      })
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[1,2,[3,4]]);
      });
    });

    it('no data returns empty stream',function() {
      return etl.toStream(function() {
        return etl.toStream();
      })
      .promise()
      .then(function(d) {
        assert.deepEqual(d,[]);
      });
    });
  });

  describe('error in the function ',function() {
    it('is passed downstream',function() {
      return etl.toStream(function() {
        throw 'ERROR';
      })
      .promise()
      .then(function() {
        throw 'SHOULD_ERROR';
      },function(e) {
        assert.equal(e,'ERROR');
      });
    });
  });

});