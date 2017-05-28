const etl = require('../index');
const Promise = require('bluebird');
const t = require('tap');

let data = [],i=0;

// Mock an elastic client
const client = {
  bulk : async function(options) {
    await Promise.delay(100);
    if (i++ == 2)
      throw 'NETWORK_ERROR';
    else {
      data = data.concat(options.body);
      return {
        items: options.body.map(function() { return {};})
      };
    }
  }
};

t.test('elastic bulk insert',async t => {  
  const upsert = etl.elastic.upsert(client,'test','test',{pushResult:true,maxRetries:1,retryDelay:10,concurrency:10});

  await etl.toStream([1,2,3,4,5,6,7,8,9,10].map(function(d) { return {_id:d,num:d};}))
    .pipe(etl.collect(2))
    .pipe(upsert)
    .promise();
    
  data = data.filter(d => d.update)
    .map(d => d.update._id);

  t.same(data,[1,2,3,4,7,8,9,10,5,6],'retries on error');
});