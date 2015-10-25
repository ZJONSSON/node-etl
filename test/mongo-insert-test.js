var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    data = require('./data'),
    mongo = require('./lib/mongo');


describe('mongo.insert',function() {
  it('pipes data into mongo',function() {
    return mongo.getCollection('insert')
      .then(function(collection) {
        var insert = etl.mongo.insert(collection,{pushResult:true});
        data.stream().pipe(insert);
        return inspect(insert);
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
        data.stream().pipe(insert);
        return inspect(insert);
      })
      .then(function(d) {
        assert.deepEqual(d,[]);
      });
  });

});