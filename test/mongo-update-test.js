const etl = require('../index');
const Promise = require('bluebird');
const data = require('./data');
const mongo = require('./lib/mongo')();
const t = require('tap');

t.test('mongo update', {autoend: true}, t => {

  t.test('single record', {autoend: true}, async t => {
    const collection = mongo.getCollection('update-empty');

    t.test('missing keys',async t => {
      const e = await Promise.try(() => etl.mongo.update(collection))
        .then(() => { throw 'Should result in an error';},Object);
      t.same(e.message,'Missing Keys','Errors');
    });

    t.test('upsert', async t => {
      const insert = etl.mongo.update(collection,['__line'],{upsert: true, pushResult:true});
      const data = etl.map();
      data.end({name:'single record',__line:999});

      const d = await data.pipe(insert).promise();

      t.same(d[0].nUpserted,1,'upserts one record');
    });

    t.test('updates into mongo', async t => {
      const insert = etl.mongo.update(collection,['__line'],{pushResult:true});
      const data = etl.map();
      data.end({name:'updated single record',__line:999});

      const d = await data.pipe(insert).promise();

      if (d[0].nModified === null)
        t.pass('WARNING - Mongo 2.6 or higher needed for nModfied');
      else
        t.same(d[0].nModified,1);
    });
  });

  t.test('bulk', {autoend:true}, async t => {
    const collection = await mongo.getCollection('update-empty');

    t.test('on an empty collection', async t => {
      const update = etl.mongo.update(collection,['name'],{pushResult:true});

      let d = await data.stream()
              .pipe(etl.collect(100))
              .pipe(update)
              .promise();
          
      d = d[0];
      t.same(d.nInserted,0,'inserts no records');
      t.same(d.nUpserted,0,'upserts no records');
      t.same(d.nMatched,0,'matched no records');
    });

    t.test('with pushresults == false',async t => {
      const collection = await mongo.getCollection('update-empty');
      const update = etl.mongo.update(collection,['name']);

      const d = await data.stream()
        .pipe(update)
        .promise();
    
      t.same(d,[],'pushes nothing downstream');
    });

    t.test('on a populated collection', {autoend: true}, async t => {
      const collection = await mongo.getCollection('update-populated',true);

      t.test('update', async t => {
        await collection.insertAsync(data.copy());
        const update = etl.mongo.update(collection,['name'],{pushResult:true});

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
        if (d.nModified === null)
          console.log('WARNING - Mongo 2.6 or higher needed for nModfied');
        else {
          t.same(d.nModified,2,'modified 2 records');
          t.same(d.nInserted,0,'inserted zero records');
        }
      });

      t.test('using find', async t => {
        const collection = await  mongo.getCollection('update-populated',true);
        const d = await collection.find({},{_id:false}).toArrayAsync();

        const expected = data.copy().map(function(d,i) {
          if (i) d.newfield = 'newfield';
          return d;
        });

        t.same(d,expected,'results were saved');
      });
    });

    t.test('using upsert option', {autoend: true}, t => {
      const collection = mongo.getCollection('upsert');

      t.test('upsert', async t => {  
        const upsert = etl.mongo.update(collection,['name'],{pushResult:true,upsert:true});
        let d = await data.stream()
          .pipe(etl.collect(100))
          .pipe(upsert)
          .promise();

        d = d[0];
        t.same(d.nUpserted,3,'3 updated');
        t.same(d.nMatched,0, '0 matched');
      });

      t.test('find',async t => {
        const collection = await mongo.getCollection('upsert');
        const d = await collection.find({},{_id:false}).toArrayAsync();
          
        t.same(d,data.data,'results are saved');
      });
    });

    t.test('using upsert function',{autoend: true}, async t => {
      const collection = await mongo.getCollection('upsert2');

      t.test('should populate', async t => {
        const upsert = etl.mongo.upsert(collection,['name'],{pushResult:true});

        let d = await data.stream()
          .pipe(etl.collect(100))
          .pipe(upsert)
          .promise();

        d = d[0];
        t.same(d.nUpserted,3,'upserts 3 records');
        t.same(d.nMatched,0,'matches 0 records');
      });

      t.test('find',async t =>  {
        const d = await collection.find({},{_id:false}).toArrayAsync();
          
        t.same(d,data.data,'results are saved');
      });
    });
  });

  t.test('error in collection',async t => {
    const collection = Promise.reject(new Error('CONNECTION_ERROR'));
    const e = await etl.toStream({test:true})
      .pipe(etl.mongo.update(collection,'_id'))
      .promise()
      .then(() => { throw 'SHOULD_ERROR';}, Object);
    t.same(e.message,'CONNECTION_ERROR','passes down');
  });
})
.catch(e => {
  if (e.message.includes('ECONNREFUSED'))
    console.warn('Warning: MongoDB server not available');
  else
    console.warn(e.message);
})
.then(() => mongo.db.then( db => db.close()));