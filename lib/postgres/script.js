var Postgres = require('./postgres'),
  util = require('util'),
  moment = require('moment');

function Script(pool, schema, table, options) {
  if (!(this instanceof Script))
    return new Script(pool, schema, table, options);

  Postgres.call(this, pool, options);

  this.schema = schema;
  this.table = table;
  this.columns = this.getColumns();
  this.pkeys = this.getPrimayKeys();
  this.prefix = this.options.prefix || 'INSERT INTO';
}

util.inherits(Script, Postgres);

Script.prototype.getColumns = function () {
  var sql = "SELECT column_name FROM INFORMATION_SCHEMA.COLUMNS WHERE " +
    "TABLE_CATALOG='" + this.schema + "' AND TABLE_NAME='" + this.table + "';";
  return this.query(sql)
    .then(function (d) {
      d = d.rows;
      if (!d.length)
        throw 'TABLE_NOT_FOUND';
      return d.map(function (d) {
        return d.column_name;
      });
    });
};

Script.prototype.getPrimayKeys = function () {
  var sql = "SELECT a.attname"
    + " FROM   pg_index i"
    + " JOIN   pg_attribute a ON a.attrelid = i.indrelid"
    + " AND a.attnum = ANY(i.indkey)"
    + " WHERE  i.indrelid = '" + this.table + "'::regclass"
    + " AND    i.indisprimary;";
  return this.query(sql)
    .then(function (d) {
      d = d.rows;
      return d.map(function (d) {
        return d.attname;
      });
    });
};

Script.prototype.buffer = undefined;

Script.prototype._push = function () {
  if (this.buffer) this.push(this.buffer);
  this.buffer = undefined;
};

Script.prototype._fn = function (record) {
  var self = this;
  return Promise.all([this.columns, this.pkeys]).then(function (data) {
    var columns = data[0];
    var pkeys = data[1];
    var d = (Array.isArray(record)) ? record[0] : record;
	if (typeof d === "undefined") { return; }
	
	if (!self.buffer) 
    self.buffer = self.prefix + " " + self.table +
      " (" + columns.join(',') + ") VALUES ";

    self.buffer += '(' + columns.map(function (key) {
        var value = d[key];
			if (typeof value === "undefined")
				return "DEFAULT";
			else if (value === null)
				return "null";
			else if (typeof value === "object")
				return escapeLiteral(JSON.stringify(value));
        else
          return escapeLiteral(value);
      })
        .join(',') + ')';


    var tmp_arr = [];
    for (var i = 0, l = columns.length; i < l; i++) {
      var value = d[columns[i]];
      if (typeof value === "undefined") {
        continue;
      }
      var sql = columns[i] + " = ";
		if (value === null)
			sql += "null";
		else if (typeof value === "object")
			sql += escapeLiteral(JSON.stringify(value));
		else
			sql += escapeLiteral(value);

		tmp_arr.push(sql);
    }
    if (tmp_arr.length && pkeys.length) {
		self.buffer += " ON CONFLICT (" + pkeys.join(', ') + ") DO UPDATE SET "+tmp_arr.join(', ');
	}
	self.buffer +=  ";";

    self._push();

  });
};

Script.prototype._flush = function (cb) {
  var self = this;
  return Postgres.prototype._flush.call(this, function () {
    self._push();
    setImmediate(cb);
  });
};

// https://github.com/brianc/node-postgres/blob/83a946f61cb9e74c7f499e44d03a268c399bd623/lib/client.js
function escapeLiteral(str) {
  var hasBackslash = false;
  var escaped = '\'';

  if (typeof str !== "string") { return str; }
  for (var i = 0; i < str.length; i++) {
    var c = str[i];
    if (c === '\'') {
      escaped += c + c;
    } else if (c === '\\') {
      escaped += c + c;
      hasBackslash = true;
    } else {
      escaped += c;
    }
  }

  escaped += '\'';

  if (hasBackslash === true) {
    escaped = ' E' + escaped;
  }

  return escaped;
}

module.exports = Script;
