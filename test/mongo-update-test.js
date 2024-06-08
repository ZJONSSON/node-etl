const etl = require('../index');
const Promise = require('bluebird');
const data = require('./data');
const {getCollection, clear} = require('./lib/mongo');
const t = require('tap');

t.test('mongo update', async t => {
  t.teardown(() => t.end());

  t.test('single record', async t => {
    const collection = await getCollection('update-empty');

    t.test('missing keys', async t => {
      const e = await Promise.try(() => etl.mongo.update(collection))
        .then(() => { throw 'Should result in an error';},Object);
      t.same(e.message,'Missing Keys','Errors');
    });

    t.test('upsert', async t => {
      const insert = etl.mongo.update(collection,['__line'],{upsert: true, pushResults:true});
      const data = etl.map();
      data.end({name:'single record',__line:999});

      const d = await data.pipe(insert).promise();

      t.same(d[0].upsertedCount,1,'upserts one record');
    });

    t.test('updates into mongo', async t => {
      const insert = etl.mongo.update(collection,['__line'],{pushResults:true});
      const data = etl.map();
      data.end({name:'updated single record',__line:999});

      const d = await data.pipe(insert).promise();

      t.same(d[0].modifiedCount,1);
    });
  });

  t.test('bulk', async t => {
    const collection = await getCollection('update-empty');

    t.test('on an empty collection', async t => {
      const update = etl.mongo.update(collection,['name'],{pushResults:true});

      let d = await data.stream()
              .pipe(etl.collect(100))
              .pipe(update)
              .promise();
          
      d = d[0];
      t.same(d.insertedCount,0,'inserts no records');
      t.same(d.upsertedCount,0,'upserts no records');
      t.same(d.matchedCount,0,'matched no records');
    });

    t.test('with pushresults == false',async t => {
      const collection = await getCollection('update-empty');
      const update = etl.mongo.update(collection,['name']);

      const d = await data.stream()
        .pipe(update)
        .promise();
    
      t.same(d,[],'pushes nothing downstream');
    });

    t.test('on a populated collection', {autoend: true}, async t => {
      const collection = await getCollection('update-populated');

      t.test('update', async t => {
        await collection.insertMany(data.copy());
        const update = etl.mongo.update(collection,['name'],{pushResults:true});

        let d = await data.stream()
          .pipe(etl.map(function(d) {
            if (d.name == 'Nathaniel Olson')
              d.name = 'Not Found';
            d.newfield='newfield';
            return d;
          }))
          .pipe(etl.collect(100))
          .pipe(update)
          .promise();
                
        d = d[0];
        t.same(d.modifiedCount,2,'modified 2 records');
        t.same(d.insertedCount,0,'inserted zero records');
      });

      t.test('using find', async t => {
        const collection = await getCollection('update-populated');
        const d = await collection.find({},{projection: {_id:false}}).toArray();

        const expected = data.copy().map(function(d,i) {
          if (i) d.newfield = 'newfield';
          return d;
        });
        t.same(d,expected,'results were saved');
      });
    });

    t.test('using upsert option', {autoend: true}, async t => {
      const collection = await getCollection('upsert');

      t.test('upsert', async t => {  
        const upsert = etl.mongo.update(collection,['name'],{pushResults:true,upsert:true});
        let d = await data.stream()
          .pipe(etl.collect(100))
          .pipe(upsert)
          .promise();

        d = d[0];
        t.same(d.upsertedCount,3,'3 updated');
        t.same(d.matchedCount,0, '0 matched');
      });

      t.test('find',async t => {
        const collection = await getCollection('upsert');
        const d = await collection.find({},{projection : {_id:false}}).toArray();
          
        t.same(d,data.data,'results are saved');
      });
    });

    t.test('using upsert function',{autoend: true}, async t => {
      const collection = await getCollection('upsert2');

      t.test('should populate', async t => {
        const upsert = etl.mongo.upsert(collection,['name'],{pushResults:true});

        let d = await data.stream()
          .pipe(etl.collect(100))
          .pipe(upsert)
          .promise();

        d = d[0];
        t.same(d.upsertedCount,3,'upserts 3 records');
        t.same(d.matchedCount,0,'matches 0 records');
      });

      t.test('find',async t =>  {
        const d = await collection.find({},{projection: {_id:false}}).toArray();
        t.same(d,data.data,'results are saved');
      });
    });
  });

  t.test('using $update with upsert function', async t => {
    const collection = await getCollection('upsert3');
    t.test('should populate', async t => {
      const upsert = etl.mongo.upsert(collection,['name'],{pushResults:true});

      let d = await data.stream()
        .pipe(etl.map(d => Object.assign( {name: d.name, $update:{$set: d}})))
        .pipe(etl.collect(100))
        .pipe(upsert)
        .promise();

      d = d[0];
      t.same(d.upsertedCount,3,'upserts 3 records');
      t.same(d.matchedCount,0,'matches 0 records');
      t.end();
    });

    t.test('find',async t =>  {
      const d = await collection.find({}, {projection: {_id: false}}).toArray();          
      t.same(d,data.data,'results are saved');
    });
  });

  t.test('error in collection', async t => {
    const collection = Promise.reject(new Error('CONNECTION_ERROR'));
    const e = await etl.toStream({test:true})
      .pipe(etl.mongo.update(collection,'_id'))
      .promise()
      .then(() => { throw 'SHOULD_ERROR';}, Object);
    t.same(e.message,'CONNECTION_ERROR','passes down');
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