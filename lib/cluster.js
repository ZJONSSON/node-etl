// Worker provides a simple framework around the cluster library to orchestrate a multicore ETL pipeline
// A tasklist is scheduled with a number of workers and then a process function is defined to process
// each element

var cluster = require('cluster'),
    Promise = require('bluebird'),
    os = require('os');

var isMaster = module.exports.isMaster = cluster.isMaster,
    isWorker = module.exports.isWorker = cluster.isWorker;


// Schedule a list of jobs to be distributed to workers
module.exports.schedule = function(list,options) {
  options = options || {};
  var reporting = options.reporting;
  var i = 0, last = 0, workers=[], results= [], reportInterval;
  if (!isMaster) 
    throw 'No scheduling from a worker';

  var threads = options.threads || os.cpus().length;
  list = [].concat(list);

  function next(worker) {
    var item = list.pop();
    if (!item) {
      if (reporting) console.log('Worker done',worker.num);
      worker.disconnect();
      worker.done.resolve(true);
    } else 
      worker.send(item);
  }

  function createWorker() {
    var worker = cluster.fork();
    
    worker.num = threads;
    worker.done = Promise.defer();
    workers.push(worker.done.promise);
    worker.on('message',function(msg) {
      if (msg.id === 'done') {
        results.push(msg.payload);
        next(worker);
      } else if (msg.id === 'error') {
        throw msg.error;
      } else if (msg.id === 'report')
        i += msg.count;
    });
  }

  while (threads--)
    createWorker();

  cluster.on('online',next);

  if (reporting)
    reportInterval = setInterval(function() {
      console.log(i-last,last);
      last = i;
    },!isNaN(reporting) ? reporting : 1000);

  return Promise.all(workers)
    .then(function() {
      clearInterval(reportInterval);
      return {
        results: results,
        count: i
      };
    });
};

// This function should be overwritten in the worker
module.exports.process = function(d,callback) {
  callback();
};

module.exports.report = function(d) {
  if (isWorker)
    process.send({id:'report',count:d});
};

if (isWorker)
  process.on('message',function(d) {
    Promise.try(module.exports.process.bind(this,d))
      .then(function(d) {
        process.send({
          id: 'done',
          payload: d
        });
      },function(e) {
        process.send({
          id: 'error',
          error: e
        });
      });
  });