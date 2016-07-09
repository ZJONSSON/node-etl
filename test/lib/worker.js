var etl = require('../../index'),
    Promise = require('bluebird');

if (etl.cluster.isWorker) {
  etl.cluster.process = function(d) {
    return Promise.delay(100).then(function() {
      etl.cluster.report(d);
      return 'ok';
    });
  };
}
