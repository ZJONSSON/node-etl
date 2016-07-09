var etl = require('../index'),
    cluster = require('cluster'),
    path = require('path'),
    assert = require('assert');

cluster.setupMaster({
  exec : path.join(__dirname,'lib','worker.js')
});


describe('cluster',function() {
  it('should schedule tasks',function() {
    return etl.cluster.schedule([1,2,3,4,5],{threads:4})
      .then(function(d) {
        assert.equal(d.count,15);
        assert.deepEqual(d.results,['ok','ok','ok','ok','ok']);
      });
  });
});
