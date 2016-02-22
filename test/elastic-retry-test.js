var etl = require('../index'),
    assert = require('assert'),
    data = require('./data');

var data = [],i=0;

// Mock an elastic client
var client = {
  bulk : function(options,cb) {
    setTimeout(function() {
      // simulate a network error
      if (i++ == 2)
        return cb('NETWORK_ERROR');
      data = data.concat(options.body);
      cb(null,{
        items: options.body.map(function() { return {};})
      });
    },100);
  }
};

describe('elastic bulk insert',function() {
  it('retries on error',function() {
    var upsert = etl.elastic.upsert(client,'test','test',{pushResult:true,maxRetries:1,retryDelay:10,concurrency:10});

    return etl.toStream([1,2,3,4,5,6,7,8,9,10].map(function(d) { return {_id:d,num:d};}))
      .pipe(etl.collect(2))
      .pipe(upsert)
      .promise()
      .then(function() {
        data = data.filter(function(d) {
          return d.update;
        })
        .map(function(d) {
          return d.update._id;
        });

        // The errored items should be in the back
        assert.deepEqual(data,[1,2,3,4,7,8,9,10,5,6]);
      });
  });  
});