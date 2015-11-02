var etl = require('../../index'),
    Promise = require('bluebird');

if (etl.cluster.isWorker) {
  etl.cluster.process = function(d,cb) {
    return Promise.delay(100).then(function() {
      etl.cluster.progress(d);
      cb();
    });
  };
}
