var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    data = require('./data'),
    mongo = require('./lib/mongo');

describe('mongo update',function() {
  describe('on an empty collection',function() {
    it('should fail to update',function() {
      return mongo.getCollection('update-empty')
        .then(function(collection) {
          var update = etl.mongo.update(collection,['name'],{pushResult:true});

          data.stream()
            .pipe(update);

          return inspect(update).then(function(d) {
            d.forEach(function(d) {
              assert.deepEqual(d,{ok:1,nModified:0,n:0});
            });
          });
        });
    });
  });

  describe('on a populated collection',function() {
    it('should update matches',function() {
      return mongo.getCollection('update-populated',true)
        .then(function(collection) {
          return collection.insertAsync(data.copy())
            .then(function() {
              var update = etl.mongo.update(collection,['name'],{pushResult:true});

              data.stream()
                .pipe(etl.map(function(d) {
                  if (d.name == 'Nathaniel Olson')
                    d.name = 'Not Found';
                  d.newfield='newfield';
                  return d;
                }))
                .pipe(update);

              return inspect(update);
            });
        })
        .then(function(d) {
          // The first one wasn't found
          assert.deepEqual(d[0],{ok:1,nModified:0,n:0});

          // The others are modified
          d.slice(1).forEach(function(d) {
            assert.deepEqual(d,{ok:1,nModified:1,n:1});
          });  
        });
    });


    it('results are saved',function() {
      return mongo.getCollection('update-populated',true)
        .then(function(collection) {
          return collection.find({},{_id:false}).toArrayAsync();
        })
        .then(function(d) {
          var expected = data.copy().map(function(d,i) {
            if (i) d.newfield = 'newfield';
            return d;
          });

          assert.deepEqual(d,expected);            
        });
    });
  });

  describe('using upsert',function() {
    it('should populate',function() {
      return mongo.getCollection('upsert')
        .then(function(collection) {
          var upsert = etl.mongo.update(collection,['name'],{pushResult:true,upsert:true});

          data.stream().pipe(upsert);

          return inspect(upsert);
        })
        .then(function(d) {
          d.forEach(function(d) {
            assert.deepEqual(d,{ok:1,nModified:0,n:1,upserted:d.upserted});
          });
       });
    });

    it('results are saved',function() {
      return mongo.getCollection('upsert')
        .then(function(collection) {
          return collection.find({},{_id:false}).toArrayAsync();
        })
        .then(function(d) {
          assert.deepEqual(d,data.data);
        });
    });
  });
});
