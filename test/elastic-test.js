var etl = require('../index'),
    assert = require('assert'),
    data = require('./data'),
    Promise = require('bluebird'),
    elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
      host: 'localhost:9200'
    });

before(function() {
  return client.indices.delete({index:'test'})
    .catch(Object);
});


describe('elastic bulk insert',function() {

  function convertHits(d) {
    return d.map(function(d) {
      d = d._source;
      d.dt = new Date(d.dt);
      return d;
    });
  }

  it('pipes data into elasticsearch',function() {
    var i = 0;
    var upsert = etl.elastic.index(client,'test','test',{pushResult:true});

    return data.stream()
      .pipe(etl.map(function(d) {
        d._id = i++;
        return d;
      }))
      .pipe(etl.collect(100))
      .pipe(upsert)
      .on('error',console.log)
      .promise()
      .then(function(d) {
        assert.equal(d[0].items.length,3);
      });
  });

  it('retrieves data back from elasticsearch',function() {
    this.timeout(3000);
    return Promise.delay(2000).then(function() {
      return client.search({index:'test',type:'test'});
    })
    .then(function(d) {
      var values = convertHits(d.hits.hits);
      assert.deepEqual(values,data.data);
    });
  });

  it('streams results with elastic.find',function() {
    var find = etl.elastic.find(client);
    find.end({index:'test','type':'test'});

    return find.promise()
      .then(function(d) {
        var values = convertHits(d);
        assert.deepEqual(values,data.data);
      });
  });


});