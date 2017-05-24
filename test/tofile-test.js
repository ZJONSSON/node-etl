const etl = require('../index');
const path = require('path');
const os = require('os');
const t = require('tap');

const filename = path.join(os.tmpdir(),Number(new Date())+'.txt');

t.test('toFile', {autoend:true}, t => {
  t.test('piping into', async t => {
    const d = await etl.toStream([1,2,[3,4]])
      .pipe(etl.stringify(0,null,true))
      .pipe(etl.toFile(filename))
      .promise();

    t.same(d,[true],'returns true when done');
  });

  t.test('reading file', async t => {
    const d = await etl.file(filename).promise();
    t.same(d[0].text,'1\n2\n[3,4]\n','verifies content');
  });
});