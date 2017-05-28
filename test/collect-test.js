const Promise = require('bluebird');
const etl = require('../index');
const dataStream = require('./lib/dataStream');
const t = require('tap');

const data = [1,2,3,4,5,6,7,8,9,10,11];

t.test('collect', {autoend: true, jobs: 10}, t => {
  
  t.test('etl.collect(3)', async t => {
    const expected = [
      [1,2,3],
      [4,5,6],
      [7,8,9],
      [10,11]
    ];

    const d = await dataStream(data).pipe(etl.collect(3)).promise();
    t.same(d,expected,'collects 3 records at a time');
  });


  t.test('etl.collect(999) for small dataset',async t => {
    const expected = [data];

    const d = await dataStream(data)
      .pipe(etl.collect(9999))
      .promise();

    t.same(d,expected,'returns everything in the array');
  });
  
  t.test('etl.collect(1)',async t => {
    const expected = data.map(d => [d]);

    const d = await dataStream(data)
      .pipe(etl.collect(1))
      .promise();

    t.same(d,expected,'returns array of one element arrays');
  });

  t.test('maxDuration',async t => {
    const d = await etl.toStream([1,2,3,4,5,6,7,8,9,10])
      .pipe(etl.map(d => Promise.delay(100).then(() => d)))
      .pipe(etl.collect(5,300))
      .promise();

    t.same(d,[[1,2,3],[4,5,6],[7,8,9],[10]],'pushes on timeouts');
  });

  t.test('maxTextLength',async t => {
    const data = [
      {text:'test'},
      {text:'test'},
      {text:'this is a really long string'},
      {text:'test'}
    ];

    const d = await etl.toStream(data)
      .pipe(etl.collect(1000,1000,15))
      .promise();

    t.same(d,[
      [data[0],data[1]],
      [data[2]],
      [data[3]]
    ],'pushes when text reaches max');
  });

  t.test('custom fn',async t => {
    const expected = [
      [1,2,3],
      [4,5,6],
      [7,8,9,10,11]
    ];

    const d = await dataStream(data)
      .pipe(etl.collect(function(d) {
        this.buffer.push(d);
        if (d < 7 && this.buffer.length > 2)
          this._push();
      }))
      .promise();

    t.same(d,expected,'runs and flush pushes remaining buffer');
  });
});