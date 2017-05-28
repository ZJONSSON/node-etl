const etl = require('../index');
const t = require('tap');

const data = [ '1','2345678','9012345678','9'];

const expected = [
  { text: '1234', __line: 0, __filename: 'text.txt' },
  { text: '5678', __line: 1, __filename: 'text.txt' },
  { text: '9012', __line: 2, __filename: 'text.txt' },
  { text: '3456', __line: 3, __filename: 'text.txt' },
  { text: '789', __line: 4, __filename: 'text.txt' },
];

t.test('cut(4)',async t => {
  const cut = etl.cut(4);

  data.forEach((d,i) => setTimeout(() => {
    cut.write(i == 2 ? d : {text:d,__filename:'text.txt'});
    if (i == data.length-1)
      cut.end();
  }));

  const d = await cut.pipe(etl.expand()).promise();
  t.same(d[0],expected[0],'splits text into packets with maxlength 4');
});
