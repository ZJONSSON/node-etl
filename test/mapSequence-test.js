const etl = require('../index');
const t = require('tap');
const Promise = require('bluebird');
const Stream = require('stream');

const TOTAL_COUNT = 50;

t.test('mapSequence',async t => {
  let count = 0;
  
  return Stream
    .Readable({
      read : function() {
        count++;
        // Keep on incrementing until we have at least 500 empty responses (probably the end)
        if (count > TOTAL_COUNT) {
          this.push(null);
        } else {
          this.push({count});
        }
      },
      objectMode:true
    })
    .pipe(etl.mapSequence(async d => {
      if (! (d.count % 2))
        await Promise.delay(10);
      return d;
    },{concurrency:5}))
    .promise()
    .then(d => t.same(d,[...Array(TOTAL_COUNT)].map( (d,i) => ({count: i+1}))));
});