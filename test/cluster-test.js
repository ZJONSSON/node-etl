var etl = require('../index'),
    cluster = require('cluster'),
    path = require('path'),
    assert = require('assert');

cluster.setupMaster({
  exec : path.join(__dirname,'lib','worker.js')
});


describe('cluster',function() {
  it('should schedule tasks',function() {
    return etl.cluster.schedule([1,2,3,4,5],3)
      .then(function(d) {
        assert.equal(d,15);
      });
  });
});
