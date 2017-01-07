/* global before */

var etl = require('../index'),
    pg = require('pg'),
    data = require('./data'),
    QueryStream = require('pg-query-stream'),
    assert = require('assert');

var pool = new pg.Pool({
  host: 'localhost',
  port: 5432,
  database: 'circle_test',
  user: 'ubuntu'
});

var p = etl.postgres.execute(pool);

before(function() {
  return p.query('CREATE SCHEMA circle_test').catch(Object)
    .then(function() {
      return p.query('DROP TABLE IF EXISTS test;');
    })
  
    .then(function() {
      return p.query(
        'CREATE TABLE test ('+
        'name varchar(45),'+
        'age integer,'+
        'dt date '+
        ')'
      );
    });
});
 
describe('postgres',function() {
  it('inserts',function() {
    return data.stream()
      .pipe(etl.postgres.upsert(pool,'circle_test','test',{pushResult:true}))
      .promise()
      .then(function(d) {
        assert.equal(d.length,3);
      });
  });

  it('and records are verified',function() {
    return p.query('SELECT * from test')
      .then(function(d) {
        assert.deepEqual(d.rows,data.data.map(function(d) {
          return {
            name : d.name,
            age : d.age,
            dt : d.dt
          };
        }));
      });
  });

  it('streaming works',function() {
    return p.stream(new QueryStream('select * from test'))
      .pipe(etl.map())
      .promise()
      .then(function(d) {
        assert.equal(d.length,3);
      });
  });
});
