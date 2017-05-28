const etl = require('../index');
const dataStream = require('./lib/dataStream');
const t = require('tap');

const data = [1,2,3,4,5,6,7,8,9,10,11];

const expected = [
  [1,2,3],
  [4,5,6],
  [7,8,9],
  [10,11]
];

t.test('chain', {autoend: true}, t => {

  t.test('returning a stream', async t => {
    const d = await dataStream(data)
      .pipe(etl.chain(stream => stream.pipe(etl.collect(3))))
      .promise();

    t.same(d,expected,'returning stream is piped down');
  });

  t.test('using the second argument as outstream',async t => {
    const d = await dataStream(data)
      .pipe(etl.chain((stream,out) =>
        stream.pipe(etl.collect(3)).pipe(out)
      ))
      .promise();

    t.same(d,expected,'outstream is piped down');
  });

  t.test('returning a promise', async t => {
    const d = await dataStream(data)
      .pipe(etl.chain(stream =>
        stream
          .pipe(etl.collect(3))
          .promise()
      ))
      .promise();
    t.same(d,expected,'pipes down promise results');
  });

  t.test('errors in subchain',async t => {
    const chain = etl.map();
    setTimeout( () => chain.end('test'));

    const e = await chain
      .pipe(etl.map())
      .pipe(etl.chain(stream =>
        stream
          .pipe(etl.map(() => { throw 'ERROR';}))
          .pipe(etl.collect(3))
      ))
      .promise()
      .then(() => { throw 'Should error';},String);

    t.same(e,'ERROR','bubble down');
  });
});