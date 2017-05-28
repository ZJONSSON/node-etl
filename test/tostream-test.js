const etl = require('../index');
const t = require('tap');

t.test('toStream', {autoend:true, jobs: 10}, t => {
  t.test('static data',t => {
    t.test('array',async t => {
      const d = await etl.toStream([1,2,[3,4]]).pipe(etl.map(d => [d])).promise();
      t.same(d,[[1],[2],[[3,4]]],'streams elements');
    });

    t.test('no data',async t => {
      const d = await etl.toStream().promise();
      t.same(d,[],'returns empty stream');
    });

    t.end();
  });

  t.test('function input', t => {
    t.test('returning an array',async t => {
      const d = await etl.toStream(() => [1,2,[3,4]]).promise();
      t.same(d,[1,2,[3,4]],'streams the array');
    });

    t.test('`this.push` and function results', async t => {
      const d = await etl.toStream(function() {
        this.push(1);
        this.push(2);
        return [[3,4]];
      }).promise();

      t.same(d,[1,2,[3,4]],'streams combined data');
    });

    t.test('undefined return', async t => {
      const d = await etl.toStream(function() {}).promise();
      t.same(d,[],'returns empty stream');
    });

    t.end();
  });

  t.test('promise input', t => {
    t.test('resolving to an array', async t => {
      const d = await etl.toStream(Promise.resolve([1,2,[3,4]])).promise();
      t.same(d,[1,2,[3,4]],'streams elements');
    });

    t.test('resolving to undefined', async t => {
      const d = await etl.toStream(Promise.resolve()).promise();
      t.same(d,[],'returns empty stream');
    });

    t.end();
  });

  t.test('function returning a stream', t => {
    t.test('with data', async t => {
      const d = await etl.toStream(() => etl.toStream([1,2,[3,4]])).promise();
      t.same(d,[1,2,[3,4]],'returns data');
    });

    t.test('with no data', async t => {
      const d = await etl.toStream(() => etl.toStream()).promise();
      t.same(d,[],'returns empty stream');
    });

    t.end();
  });

  t.test('error in the function ', async t =>  {
    const e = await etl.toStream(() => { throw 'ERROR'; })
      .promise()
      .then(() => { throw 'SHOULD_ERROR';}, String);
    
    t.same(e,'ERROR','is passed downstream');
  });
});