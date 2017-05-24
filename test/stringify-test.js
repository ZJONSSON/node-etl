const etl = require('../index');
const t = require('tap');

const data = [
  {a:1,b:'test1'},
  {a:2,b:'test2'}
];

function dataStream() {
  const s = etl.streamz();
  data.forEach(d => s.write(d));
  s.end();
  return s;
}

t.test('stringify', {autoend:true, jobs: 10}, t => {
  t.test('etl.stringify()',async t => {
    const stringify = etl.stringify();
    const expected = [ '{"a":1,"b":"test1"}', '{"a":2,"b":"test2"}' ];
    const d = await dataStream().pipe(stringify).promise();

    t.same(d,expected,'returns stringified object');
  });

  t.test('etl.stringify(d)', async t => {
    const stringify = etl.stringify(2);
    const expected = [ '{\n  "a": 1,\n  "b": "test1"\n}', '{\n  "a": 2,\n  "b": "test2"\n}' ];
    const d = await dataStream().pipe(stringify).promise();

    t.same(d,expected, 'returns indented object');
  });
});