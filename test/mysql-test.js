const etl = require('../index');
const mysql = require('mysql');
const data = require('./data');
const t = require('tap');

const pool = mysql.createPool({
  host: 'localhost',
  connectionLimit : 10,
  user: 'ubuntu'
});

const p = etl.mysql.execute(pool);

const before = async function() {
  await p.query('DROP TABLE IF EXISTS circle_test.test;');
  await p.query(
    'CREATE TABLE circle_test.test ('+
    'name varchar(45) DEFAULT NULL,'+
    'age int(11) DEFAULT NULL,'+
    'dt datetime DEFAULT NULL '+
    ')'
  );
};
 
t.test('mysql', {timeout: 20000, autoend:true}, async function(t) {
  await before();

  t.test('inserts', async function(t) {
    const d = await data.stream()
      .pipe(etl.mysql.upsert(pool,'circle_test','test',{pushResult:true}))
      .promise();

    t.same(d[0].affectedRows,3,'returns right length');
  });

  t.test('selecting back',async function(t){
    const d = await p.query('SELECT * from circle_test.test');

    t.same(d,data.data.map(d => ({
      name : d.name,
      age : d.age,
      dt : d.dt          
    })));
  });

  t.test('streaming works',async function(t) {
    const d = await p.stream('select * from circle_test.test').promise();
    t.same(d.length,3);
  });

})
.catch(console.log)
.then(() => pool.end());