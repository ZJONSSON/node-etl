var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    data = require('./data'),
    elasticsearch = require('elasticsearch');

var client = new elasticsearch.Client({
      host: 'localhost:9200'
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
    var upsert = etl.elastic.upsert(client,'test','test',{pushResult:true});
    data.stream()
      .pipe(etl.map(function(d) {
        d._id = i++;
        return d;
      }))
      
      .pipe(etl.collect(100))
      .pipe(upsert)
      .on('error',console.log);

    return inspect(upsert).then(function(d) {
      
      assert.equal(d[0][0].items.length,3);
      
    });
  });

  it('retrieves data back from elasticsearch',function() {
    return client.search({index:'test',type:'test'})
      .then(function(d) {
        var values = convertHits(d.hits.hits);
        assert.deepEqual(values,data.data);
      });
  });

  it('streams results with elastic.find',function() {
    var find = etl.elastic.find(client);
    find.end({index:'test','type':'test'});

    return inspect(find).then(function(d) {
      var values = convertHits(d);
      assert.deepEqual(values,data.data);
    });
  });


});