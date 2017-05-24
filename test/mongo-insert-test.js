const etl = require('../index');
const data = require('./data');
const mongo = require('./lib/mongo')();
const t = require('tap');

t.test('mongo.insert', async t => {
  await mongo.db;
  
  t.test('piping data into mongo.insert',async t => {
    const d = await mongo.getCollection('insert')
      .then(collection => {
        return data.stream()
          .pipe(etl.mongo.insert(collection,{pushResult:true}))
          .promise();
      });

    d.forEach(d => t.same(d,{ok:1,n:1},'inserts each record'));
  });

  t.test('mongo collection',async t => {
    const collection = await mongo.getCollection('insert',true);
    const d = await collection.find({},{_id:false}).toArrayAsync();

    t.same(d,data.data,'reveals data');
  });

  t.test('pushResults == false and collection as promise',async t => {
    const d = await mongo.getCollection('insert')
      .then(collection => {
        return data.stream(etl.mongo.insert(Promise.resolve(collection)))
          .pipe(etl.mongo.insert(Promise.resolve(collection)))
          .promise();
      });

    t.same(d,[],'returns nothing');
  });

  t.test('error in collection', async t => {
    const collection = Promise.reject(new Error('CONNECTION_ERROR'));
    const e = await etl.toStream({test:true})
      .pipe(etl.mongo.update(collection,'_id'))
      .promise()
      .then(() => {throw 'SHOULD_ERROR';}, Object);

    t.same(e.message,'CONNECTION_ERROR','should bubble down');
  });
})
.then(
  () => mongo.db.then( db => db.close()),
  e => {
    if (e.message.includes('ECONNREFUSED'))
      console.warn('Warning: MongoDB server not available');
    else
      throw e;
  }
);


  