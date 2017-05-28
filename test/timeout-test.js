const Promise = require('bluebird');
const etl = require('../index');
const t = require('tap');

t.test('timeout', {autoend:true, jobs: 10}, t => {
  t.test('with no delay', async t => {
    const timeout = etl.timeout(100);
    const d = await etl.toStream([1,2,3,4])
      .pipe(etl.map(d => Promise.delay(30,d)))
      .pipe(timeout)
      .promise();

    t.same(d,[1,2,3,4],'results are as expected');
    t.same(timeout.interval._idleTimeout,-1,'cleans up setInterval');
  });
    
  t.test('with a triggering delay',async t => {
    const timeout = etl.timeout(100);   
    const e = await etl.toStream([1,2,3,4])
      // Delay by 250ms when we see '4'
      .pipe(etl.map(d => Promise.delay(d === 4 ? 250 : 30,d)))
      .pipe(timeout)
      .promise()
      .then(() => { throw 'SHOULD_ERROR'; }, String);

    t.same(e,'ETL_TIMEOUT','emits timeout');
    t.same(timeout.interval._idleTimeout,-1,'cleans up setInterval');
  });
});