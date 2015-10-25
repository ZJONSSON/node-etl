var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    data = require('./data'),
    Promise = require('bluebird'),
    mongo = require('mongodb');


Promise.promisifyAll(mongo);
Promise.promisifyAll(mongo.MongoClient);

var collection;

before(function() {
  return mongo.connectAsync('mongodb://localhost:27017')
    .then(function(db)  {
      collection = db.collection('etl-test');
      return collection.removeAsync({});
    },function(e) {
      throw 'Unable to connect to local mongodb: '+e.message;
    });
});

describe('mongo insert',function() {
  it('pipes data into mongo',function() {
    var mongo = etl.mongo.insert(collection);
    data.getData().pipe(mongo);
    return inspect(mongo);
  });

  it('reading data back',function() {
    return collection.find({})
      .toArrayAsync()
      .then(function(d) {
        
        d.forEach(function(d) {
          d.dt = new Date(d.dt);
        });

        assert.deepEqual(d,data.data);
    });
  });
});