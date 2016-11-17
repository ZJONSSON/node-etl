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
    })
    .sort(function(a,b) {
      return a.__line - b.__line;
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
      .promise()
      .then(function(d) {
        assert.equal(d[0].items.length,3);
        assert.deepEqual(d[0].items[0].body,data.data[0]);
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

  it('streams results with elastic.scroll',function() {
    var scroll = etl.elastic.scroll(client,{index: 'test', type: 'test', size: 1},{ highWaterMark: 0 });
    // setting highWaterMark to zero and size = 1 allows us to test for backpressure
    // a missing scroll_id would indicate that scrolling has finished pre-emptively
    return scroll.pipe(etl.map(function(d) {
      assert(scroll.scroll_id && scroll.scroll_id.length,'Scroll id missing -  backpressure not managed');
      return Promise.delay(200).then(function() { return d; });
    },{highWaterMark: 0}))
    .promise()
    .then(function(d) {
      assert.equal(scroll.scroll_id,undefined);  // scrolling has finished
      assert.deepEqual(convertHits(d),data.data);
    });
  });
});