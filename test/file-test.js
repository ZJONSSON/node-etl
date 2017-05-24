const etl = require('../index');
const path = require('path');
const data = require('./data');
const t = require('tap');

t.test('file', {autoend: true}, async t => {
  const file = await etl.file(path.join(__dirname,'test.txt')).promise();
    
  t.test('results', t => {
    t.same(file[0].text,data.fixed.join(''),'return data');
    t.same(file[0].__filename,'test.txt','contain file information');
    t.end();
  });
    
  t.test('piped',async t => {
    const expected = data.copy().map(d => {
      d.__path = undefined;
      d.category = 'A';
      return d;
    });

    const d = await etl.file(path.join(__dirname,'test.txt'),{info:{category:'A'}})
      .pipe(etl.fixed(data.layout))
      .pipe(etl.expand())
      .promise();
    
    d.forEach(d => d.__path = undefined);
    t.same(d,expected,'returns data');
  });
});