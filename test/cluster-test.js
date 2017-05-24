const etl = require('../index');
const cluster = require('cluster');
const path = require('path');
const t = require('tap');

cluster.setupMaster({
  exec : path.join(__dirname,'lib','worker.js')
});


t.test('cluster', async t => {
  const d = await etl.cluster.schedule([1,2,3,4,5],3);
  t.equal(d,15,'should schedule tasks');
});
