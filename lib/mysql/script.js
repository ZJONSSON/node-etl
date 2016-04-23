var Mysql = require('./mysql'),
    util = require('util'),
    moment = require('moment');

function Script(pool,schema,table,options) {
  if (!(this instanceof Script))
    return new Script(pool,schema,table,options);

  Mysql.call(this,pool,options);

  this.schema = schema;
  this.table = table;  
  this.columns = this.getColumns();
  this.prefix = this.options.prefix || 'REPLACE INTO ';
  this.maxBuffer = this.options.maxBuffer || 1024 * 1024;
}

util.inherits(Script,Mysql);

Script.prototype.getColumns = function() {
  var sql = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE '+
            'TABLE_SCHEMA="'+this.schema+'" AND TABLE_NAME="'+this.table+'";';
  return this.query(sql)
  .then(function(d) {
    if (!d.length)
      throw 'TABLE_NOT_FOUND';
    return d.map(function(d) {
      return d.COLUMN_NAME;
    });
  });
};

Script.prototype.buffer = undefined;

Script.prototype._push = function() {
  if (this.buffer) this.push(this.buffer);
  this.buffer = undefined;
};

Script.prototype._fn = function(d) {
  var self = this;
  return this.columns.then(function(columns) {
    if (!self.buffer)
      self.buffer = self.prefix+' '+self.schema+'.'+self.table+
                    ' ('+columns.join(',')+') VALUES ';
    else
      self.buffer += ', ';

    self.buffer += '('+columns.map(function(key) {
      var value = d[key];
      return self.pool.escape(value);
    })
    .join(',')+')';

    if (self.buffer.length >= self.maxBuffer)
      self._push();
  });
};

Script.prototype._flush = function(cb) {
  var self = this;
  return Mysql.prototype._flush.call(this,function() {
    self._push();  
    setImmediate(cb);
  });
};

module.exports = Script;