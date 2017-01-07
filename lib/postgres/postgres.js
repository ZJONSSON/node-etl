var Streamz = require('streamz'),
    util = require('util'),
    Promise = require('bluebird');

function Postgres(pool,options) {
  if (!(this instanceof Postgres))
    return new Postgres(pool);

  if (!pool)
    throw 'POOL_MISSING';

  Streamz.call(this,options);
  this.pool = pool;
  this.options = options || {};
}

util.inherits(Postgres,Streamz);

Postgres.prototype.getConnection = function() {
  // Needs from refactor
  return Promise.fromNode(this.pool.connect.bind(this.pool))
    .disposer(function(connection) {
      connection.release();
    });
};

Postgres.prototype.query = function(query,cb) {
  return Promise.using(this.getConnection(),function(connection) {
    // Trigger callback when we get a connection, not when we (later) get results
    // allowing overall concurrency to be controlled by the Postgres pool
    if (typeof cb === 'function') cb();
    return Promise.fromNode(function(callback) {
      connection.query(query,callback);
    });
  });
};

Postgres.prototype.stream = function(query,cb) {
  var passThrough = Streamz();

  if (!query || query.state !== 'initialized') {
    passThrough.emit('error',new Error('Query should be QueryStream'));
    return passThrough;
  }

  Promise.using(this.getConnection(),function(connection) {
    // Trigger callback when we get a connection, not when we (later) get results
    // allowing overall concurrency to be controlled by the Postgres pool
    if (typeof cb === 'function') cb();
    return new Promise(function(resolve,reject) {
      connection.query(query)
        .on('end',resolve)
        .on('error',reject)
        .pipe(passThrough);
    });
  })
  .catch(function(e) {
    passThrough.emit('error',e);
  });

  return passThrough; 
  
};

module.exports = Postgres;