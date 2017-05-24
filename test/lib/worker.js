const etl = require('../../index');
const Promise = require('bluebird');

if (etl.cluster.isWorker) {
  etl.cluster.process = d => Promise.delay(100)
  	.then(() => etl.cluster.progress(d));
}
