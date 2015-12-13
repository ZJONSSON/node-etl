var etl = require('../index'),
    inspect = require('./lib/inspect'),
    Promise = require('bluebird'),
    assert = require('assert'),
    data = require('./data'),
    mongo = require('./lib/mongo');

describe('mongo update',function() {

  describe('single record',function() {
    var collection = mongo.getCollection('update-empty');

    it('missing keys fails',function() {
      return Promise.try(function() {
          return etl.mongo.update(collection);
         })
        .then(function() {
          throw 'Should result in an error';
        },Object);
    });

    it('upserts into mongo',function() {
      var insert = etl.mongo.update(collection,['__line'],{upsert: true, pushResult:true});
      var data = etl.map();
      data.end({name:'single record',__line:999});

      data.pipe(insert);

      return inspect(insert)
        .then(function(d) {
          d = d[0];
          assert.equal(d.nUpserted,1);   
        });
    });

    it('updates into mongo',function() {
      var insert = etl.mongo.update(collection,['__line'],{pushResult:true});
      var data = etl.map();
      data.end({name:'updated single record',__line:999});

      data.pipe(insert);
      return inspect(insert)
        .then(function(d) {
          d = d[0];
          if (d.nModified === null)
              console.log('WARNING - Mongo 2.6 or higher needed for nModfied');
          else
            assert.equal(d.nModified,1);
        });
    });
  });

  describe('bulk',function() {
    describe('on an empty collection',function() {
      it('should fail to update',function() {
        return mongo.getCollection('update-empty')
          .then(function(collection) {
            var update = etl.mongo.update(collection,['name'],{pushResult:true});

            data.stream()
              .pipe(etl.collect(100))
              .pipe(update);

            return inspect(update);
          })
          .then(function(d) {
            d = d[0];
            assert.equal(d.nInserted,0);
            assert.equal(d.nUpserted,0);
            assert.equal(d.nMatched,0);
          });
      });
    });

    describe('with pushresults == false',function() {
      it('pushes nothing downstream',function() {
        return mongo.getCollection('update-empty')
          .then(function(collection) {
            var update = etl.mongo.update(collection,['name']);

            data.stream()
              .pipe(update);

            return inspect(update);
          })
          .then(function(d) {
            assert.deepEqual(d,[]);
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
                  .pipe(etl.collect(100))
                  .pipe(update);

                return inspect(update);
              });
          })
          .then(function(d) {
            d = d[0];
            if (d.nModified === null)
              console.log('WARNING - Mongo 2.6 or higher needed for nModfied');
            else
              assert.equal(d.nModified,2);
            assert.equal(d.nInserted,0);
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

            data.stream()
              .pipe(etl.collect(100))
              .pipe(upsert);

            return inspect(upsert);
          })
          .then(function(d) {
            d = d[0];
            assert.equal(d.nUpserted,3);
            assert.equal(d.nMatched,0);
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
});
