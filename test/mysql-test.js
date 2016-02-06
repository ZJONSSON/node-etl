/* global before */

var etl = require('../index'),
    mysql = require('mysql'),
    data = require('./data'),
    assert = require('assert');

var pool = mysql.createPool({
  host: 'localhost',
  connectionLimit : 10,
  user: 'ubuntu'
});

var p = etl.mysql.execute(pool);

before(function() {
  return p.query('DROP TABLE IF EXISTS circle_test.test;')
    .then(function() {
      return p.query(
        'CREATE TABLE circle_test.test ('+
        'name varchar(45) DEFAULT NULL,'+
        'age int(11) DEFAULT NULL,'+
        'dt datetime DEFAULT NULL '+
        ')'
      );
    });
});
 
describe('mysql',function() {
  it('inserts',function() {

    var script = etl.mysql.script(pool,'circle_test','test'),
        execute = etl.mysql.execute(pool,{pushResult:true}),
        end = etl.map();
    
    return data.stream()
      .pipe(script)
      .pipe(execute)
      .pipe(end)
      .promise()
      .then(function(d) {
        assert.equal(d[0].affectedRows,3);
      });
  });

  it('and records are verified',function() {
    return p.query('SELECT * from circle_test.test')
      .then(function(d) {
        assert.deepEqual(d,data.data.map(function(d) {
          return {
            name : d.name,
            age : d.age,
            dt : d.dt
          };
        }));
      });
  });

  it('streaming works',function() {
    return p.stream('select * from circle_test.test')
      .promise()
      .then(function(d) {
        assert.equal(d.length,3);
      });
  });

});
