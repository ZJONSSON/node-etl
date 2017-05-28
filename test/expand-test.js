const etl = require('../index');
const data = require('./data');
const t = require('tap');


t.test('expanded', {autoend: true, jobs: 10}, async t => {
  t.test('stream without expanded', async t => {
    const d = await data.stream({clone:true}).pipe(etl.map()).promise();
    d.forEach(d => t.same(Object.keys(d),{},'no prototype keys'));
  });

  t.test('stream with expanded', async t => {
    const d = await data.stream({clone:true}).pipe(etl.expand()).promise();
    t.same(d,data.data,'prototype data is available');
  });

  t.test('etl.expand(\'uppercase\')', async t => {
    const ukeys = Object.keys(data.data[0]).map(key => key.toUpperCase());

    const d = await data.stream({clone:true})
      .pipe(etl.expand('uppercase'))
      .promise();

    t.same(Object.keys(d[0]),ukeys,'converts keys to uppercase');
  });

  t.test('etl.expand(\'lowercase\')',async t => {
    const lkeys = Object.keys(data.data[0]).map(key => key.toLowerCase());
    
    const d = await data.stream({clone:true})
      .pipe(etl.expand('lowercase'))
      .promise();
    
    d.forEach(d => t.same(Object.keys(d),lkeys,'converts keys to lowercase'));
  });

  t.test('etl.expand(customTransform)',async t => {
    function customTransform(key) {
      if (key == '__line') return;
      return 'custom_'+key;
    }

    const ckeys = Object.keys(data.data[0])
      .filter(key => key !== '__line')
      .map(key => 'custom_'+key);

    const d = await data.stream({clone:true})
      .pipe(etl.expand(customTransform))
      .promise();
    
    d.forEach(d => t.same(Object.keys(d),ckeys, 'transforms keys'));
  });
});