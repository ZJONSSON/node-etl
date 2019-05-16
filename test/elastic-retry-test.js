const etl = require('../index');
const Promise = require('bluebird');
const t = require('tap');

let data = [], i=0;
let retries = 0;

// Mock an elastic client
const client = {
  bulk : async function(options) {
    await Promise.delay(100);
    if (i++ == 2) {
      retries++;
      throw 'NETWORK_ERROR';
    }
    else {
      data = data.concat(options.body);
      return {
        items: options.body.slice(0, options.body.length/2).map(function() { return {};})
      };
    }
  }
};

const backoffFailingClient = {
  bulk: async function() {
    throw {message: 'network_error'};
  }
};

t.test('elastic bulk insert retry ',async t => {  
  const upsert = etl.elastic.upsert(client,'test','test',{pushResult:true,maxRetries:1,retryDelay:10,concurrency:10});

  await etl.toStream([1,2,3,4,5,6,7,8,9,10].map(function(d) { return {_id:d,num:d};}))
    .pipe(etl.collect(2))
    .pipe(upsert)
    .promise();
    
  data = data.filter(d => d.update)
    .map(d => d.update._id);

  t.same(retries, 1, 'A single retry is made');
  t.same(data,[1,2,3,4,7,8,9,10,5,6],'retries on error');
});

t.test('elastic bulk insert retry single item',async t => {  

  // Mock an elastic client
  const singleFailureRetryClient = {
    bulk : async function(options) {
      await Promise.delay(100);
      if (options.body.length === 4) {
        return {
          items: [
            {
              update: { error: 'unable to insert' }
            },
            {
              update: { _id: options.body[2].update._id }
            }
          ]
        };
      }
      else if (options.body.length === 2) {
        return {
          items: [{update: { _id: options.body[0].update._id }}]
        };
      }
    }
  };

  const upsert = etl.elastic.upsert(singleFailureRetryClient,'test','test',{pushResult:true,maxRetries:1,retryDelay:10,concurrency:10});

  let data = await etl.toStream([1,2,3,4,5,6,7,8,9,10].map(function(d) { return {_id:d,num:d};}))
    .pipe(etl.collect(2))
    .pipe(upsert)
    .promise();
  
  data = [].concat.apply([],data.map(d => d.items));
  
  data = data.filter(d => d.update)
    .map(d => d.update._id);

  t.same(data,[2,1,4,3,6,5,8,7,10,9],'retries on error');
});


t.test('backoff retries', async t => {
  const options = {pushResult:true,maxRetries:7, backoffDelay:10, maxBackoffDelay: 250};
  const upsert = etl.elastic.upsert(backoffFailingClient,'test','test', options);
  let err;

  await etl.toStream([1,2,3].map(function(d) { return {_id:d,num:d};}))
    .pipe(etl.collect(3))
    .pipe(upsert)
    .promise()
    .catch(e => err = e);

  t.same(err.retries, [10, 20, 40, 80, 160, 250, 250], 'exponential backoff with a cap');
});

t.test('backoff retries with variance', async t => {
  const options = {pushResult:true,maxRetries:7, backoffDelay:10, backoffVariance: 0.1, maxBackoffDelay: 250};
  const upsert = etl.elastic.upsert(backoffFailingClient,'test','test', options);
  let err;

  await etl.toStream([1,2,3].map(function(d) { return {_id:d,num:d};}))
    .pipe(etl.collect(3))
    .pipe(upsert)
    .promise()
    .catch(e => err = e);

  const mean = [10, 20, 40, 80, 160, 250, 250];

  t.ok(err.retries.every( (d,i) => {
    const expected = mean[i]; 
    const low = expected * (1 - options.backoffVariance);
    const high = expected * (1 + options.backoffVariance);
    return low < d && d < Math.min(high, 251);
  }));

  t.same(err.retries.length, options.maxRetries, 'maxRetries performed');
});
