const etl = require('../index');
const data = require('./data');
const {getCollection, clear} = require('./lib/mongo');
const t = require('tap');
const Promise = require('bluebird');

t.test('mongo.insertMany', async t => {

  t.teardown(() => t.end());
  
  t.test('piping data into mongo.insertMany',async t => {
    const collection = await getCollection('insert-many');
    const d = await data.stream()
                    .pipe(etl.collect(1))
                    .pipe(etl.mongo.insertMany(collection,{pushResult:true}))
                    .promise();
    d.forEach(d => t.same(d,{ok:1,n:1},'inserts each record'));
  });

  t.test('mongo collection',async t => {
    const collection = await getCollection('insert-many');
    const d = await collection.find({},{ projection: {_id:0}}).toArray();

    t.same(d,data.data,'reveals data');
  });

  t.test('pushResults == false and collection as promise',async t => {
    const collection = await getCollection('insert-many');
    const d = await data.stream(etl.mongo.insertMany(collection))
                .pipe(etl.collect(4))
                .pipe(etl.mongo.insertMany(collection))
                .promise();

    t.same(d,[],'returns nothing');
  });

  t.test('error in collection', async t => {
    const collection = Promise.reject({message: 'CONNECTION_ERROR'});
    collection.suppressUnhandledRejections();
    const e = await etl.toStream({test:true})
      .pipe(etl.collect(1))
      .pipe(etl.mongo.insertMany(collection))
      .promise()
      .then(() => {throw 'SHOULD_ERROR';}, Object);

    t.same(e.message,'CONNECTION_ERROR','should bubble down');
  });
})
.then(() => clear())
.then(() => t.end())
.catch(e => {
  if (e.message.includes('ECONNREFUSED'))
    console.warn('Warning: MongoDB server not available');
  else
    console.warn(e.message);
});

  