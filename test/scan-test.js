const etl = require('../index');
const Promise = require('bluebird');
const t = require('tap');

const dataStream = require('./lib/dataStream');
const data = [1,2,3,4,5,6,7,8,9,10,11];

t.test('prescan', {autoend: true, jobs: 10}, t => {

  t.test('etl.prescan(3) with stream of objects',async t => {
    let prescanned,firstRecord;
    const d = await dataStream(data)
      .pipe(etl.prescan(3,d => Promise.delay(500).then(() => prescanned = d)))
      .pipe(etl.map(d => {
        if (!firstRecord)
          firstRecord = prescanned || [];
        return d;
      }))
      .promise();

    t.same(prescanned,[1,2,3],'first 3 records prescanned');
    t.same(firstRecord,[1,2,3],'prescan finished before streaming down');
    t.same(d,data,'all data is piped down');
  });

  t.test('etl.prescan(100) with stream of 10 objects',async t => {
    let prescanned,firstRecord;
    const d = await dataStream(data)
      .pipe(etl.prescan(100,d => Promise.delay(500).then(() => prescanned = d)))
      .pipe(etl.map(d => {
        if (!firstRecord)
          firstRecord = prescanned || [];
        return d;
      }))
      .promise();

    t.same(prescanned,data,'first 3 records prescanned');
    t.same(firstRecord,data,'prescan finished before streaming down');
    t.same(d,data,'all data is piped down');
  });

  t.test('etl.prescan(30) with strings',async t => {
    const text = [
      'Lorem ipsum dolor sit amet, ',
      'consectetur adipiscing elit, ',
      'sed do eiusmod tempor incididunt ',
      'ut labore et dolore magna aliqua.' 
    ];

    let prescanned,firstRecord;
    const d = await dataStream(text)
      .pipe(etl.prescan(30,d => Promise.delay(10).then(() => prescanned = d)))
      .pipe(etl.map(d => {
        if (!firstRecord)
          firstRecord = prescanned || [];
        return d;
      }))
      .promise();

    t.same(prescanned,text.slice(0,2),'first 3 records prescanned');
    t.same(firstRecord,text.slice(0,2),'prescan finished before streaming down');
    t.same(d,text,'all data is piped down');
  });
});