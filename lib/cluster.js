// Worker provides a simple framework around the cluster library to orchestrate a multicore ETL pipeline
// A tasklist is scheduled with a number of workers and then a process function is defined to process
// each element

const cluster = require('cluster');
const os = require('os');
const Promise = require('bluebird');

const isMaster = module.exports.isMaster = cluster.isMaster;
const isWorker = module.exports.isWorker = cluster.isWorker;


// Schedule a list of jobs to be distributed to workers
module.exports.schedule = function(list,threads,reporting) {
  let i = 0, last = 0, workers=[], reportInterval;
  if (!isMaster) 
    throw 'No scheduling from a worker';

  threads = threads || os.cpus().length;
  list = [].concat(list);

  function next(worker) {
    const item = list.pop();
    if (!item) {
      if (reporting) console.log('Worker done',worker.num);
      worker.disconnect();
      worker.done.resolve(true);
    } else 
      worker.send(item);
  }

  function createWorker() {
    const worker = cluster.fork();
    
    worker.num = threads;
    worker.done = Promise.defer();
    workers.push(worker.done.promise);
    worker.on('message',function(msg) {
      if (msg.id === 'done')
        next(worker);
      
      if (msg.id === 'progress')
        i+= msg.items;
    });
  }

  while (threads--)
    createWorker();

  cluster.on('online',next);

  if (reporting)
    reportInterval = setInterval(() => {
      console.log(i-last,last);
      last = i;
    },!isNaN(reporting) ? reporting : 1000);

  return Promise.all(workers)
    .then(() => {
      clearInterval(reportInterval);
      return i;
    });
};

// This function should be overwritten in the worker
module.exports.process = function(d,callback) {
  callback();
};

module.exports.progress = function(d) {
  if (isWorker)
    process.send({id:'progress',items:d});
};

if (isWorker)
  process.on('message',d => {
    const done = ()  => process.send({id: 'done'});
    if (module.exports.process.length > 1)
      module.exports.process(d,done);
    else
      Promise.resolve(module.exports.process(d)).then(done);
  });