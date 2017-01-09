var etl = require('../index'),
    assert = require('assert'),
    data = require('./data'),
    mongo = require('./lib/mongo');


describe('mongo.insert',function() {
  it('pipes data into mongo',function() {
    return mongo.getCollection('insert')
      .then(function(collection) {
        var insert = etl.mongo.insert(collection,{pushResult:true});
        return data.stream()
          .pipe(insert)
          .promise();
      })
      .then(function(d) {
        d.forEach(function(d) {
          assert.deepEqual(d,{ok:1,n:1});
        });
      });
  });

  it('results are saved',function() {
    return mongo.getCollection('insert',true)
      .then(function(collection) {
        return collection.find({},{_id:false}).toArrayAsync();
      })
      .then(function(d) {
        assert.deepEqual(d,data.data);
      });
  });

  it('pushResults == false and collection as promise',function() {
    return mongo.getCollection('insert')
      .then(function(collection) {
        var insert = etl.mongo.insert(Promise.resolve(collection));
        return data.stream()
          .pipe(insert)
          .promise();
      })
      .then(function(d) {
        assert.deepEqual(d,[]);
      });
  });

  it('error in collection emits error',function() {
    var collection = Promise.reject(new Error('CONNECTION_ERROR'));
    return etl.toStream({test:true})
      .pipe(etl.mongo.update(collection,'_id'))
      .promise()
      .then(function() {
        throw 'SHOULD_ERROR';
      },function(e) {
        assert.equal(e.message,'CONNECTION_ERROR');
      });
  });
});