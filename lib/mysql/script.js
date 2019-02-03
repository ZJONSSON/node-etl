const Mysql = require('./mysql');

class Script extends Mysql {
  constructor(pool,schema,table,options) {
      super(pool, options);

    this.schema = schema;
    this.table = table;
    this.columns = this.getColumns();
    this.prefix = this.options.prefix || 'REPLACE INTO ';
    this.maxBuffer = this.options.maxBuffer || 1024 * 1024;
  }
  
  async getColumns() {
    const sql = 'SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE '+
              `TABLE_SCHEMA="${this.schema}" AND TABLE_NAME="${this.table}";`;

    const d = await this.query(sql)
    
    if (!d.length) throw 'TABLE_NOT_FOUND';
    return d.map(d => d.COLUMN_NAME);
  }

  _push() {
    if (this.buffer) this.push(this.buffer);
    this.buffer = undefined;
  }

  async _fn(d) {
    const columns = await this.columns;


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
  }

  _flush(cb) {
    this._push();
    setImmediate(() => Mysql.prototype._flush(cb));
  }
}

module.exports = Script;
