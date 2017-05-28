const etl = require('../index');
const Promise = require('bluebird');
const t = require('tap');

t.test('keepOpen', {autoend: true, jobs: 10}, t => {
  t.test('after end',async t => {
    const p = etl.keepOpen(500);
    const d = await etl.toStream([1,999,[3,4]])
      .pipe(p)
      .pipe(etl.map(d => {
        if (d === 999)
          Promise.delay(200)
           .then(() => p.write(2));
        else
          return d;
      }))
      .promise();

    t.same(d,[1,[3,4],2],'stays open as long as data arrives before timeout');
  });

  t.test('data arrives after timeout', async t => {
    const p = etl.keepOpen(100);

    const e = await etl.toStream([1,undefined,[3,4]])
      .pipe(p)
      .pipe(etl.map(d => {
        if (d === undefined)
          return Promise.delay(1000)
           .then(p.write.bind(p,2));
        else
          return d;
      }))
      .promise()
      .then(function() { throw 'Should Error'; },Object);

    t.ok(e.message === 'stream.push() after EOF' || e.message === 'write after end','should error');
  });  
});