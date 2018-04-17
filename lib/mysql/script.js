const Mysql = require('./mysql');
const util = require('util');

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
  const sql = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE '+
            `TABLE_SCHEMA="${this.schema}" AND TABLE_NAME="${this.table}";`;

  return this.query(sql)
    .then(d => {
      if (!d.length)
        throw 'TABLE_NOT_FOUND';
      return d.map(d => d.COLUMN_NAME);
    });
};

Script.prototype.buffer = undefined;

Script.prototype._push = function() {
  if (this.buffer)
    this.push(this.buffer);
  this.buffer = undefined;
};

Script.prototype._fn = function(d) {
  return this.columns.then(columns => {
    if (!this.buffer)
      this.buffer = `${this.prefix} ${this.schema}.${this.table} ( ${columns.join(',')} ) VALUES`;
    else
      this.buffer += ', ';

    this.buffer += '('+columns.map(key => {
      const value = d[key];
      if (typeof value === 'undefined')
        return 'DEFAULT';
      else
        return this.pool.escape(value);
    })
    .join(',')+')';

    if (this.buffer.length >= this.maxBuffer)
      this._push();
  });
};

Script.prototype._flush = function(cb) {
  this._push();
  setImmediate(() => Mysql.prototype._flush(cb));
};

module.exports = Script;
