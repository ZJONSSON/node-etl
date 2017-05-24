const etl = require('../index');
const t = require('tap');

const data = [
  'here are\nso',
  'me chunks\n',
  'of data\nDATA1   \nDATA2\nDATA3\n    '
];

t.test('etl.split()', async t => {
  const expected = [
    { text: 'here are', __line: 0, __filename: 'text.txt' },
    { text: 'some chunks', __line: 1, __filename: 'text.txt' },
    { text: 'of data', __line: 2, __filename: 'text.txt' },
    { text: 'DATA1', __line: 3, __filename: 'text.txt' },
    { text: 'DATA2', __line: 4, __filename: 'text.txt' },
    { text: 'DATA3', __line: 5, __filename: 'text.txt' }
  ];

  const split = etl.split();

  data.forEach((d,i) => {
    setTimeout(() => {
      split.write(i == 2 ? d : {text:d,__filename:'text.txt'});
      if (i == data.length-1)
        split.end();
    });
  });

  const d = await split.pipe(etl.expand()).promise();
  t.same(d,expected,'splits data on newlines by default');
});

t.test('split(\'a\')', async t => {
  const split = etl.split('a');

  const expected = [
    { text: 'here', __line: 0, __filename: 'text.txt' },
    { text: 're\nsome chunks\nof d', __line: 1, __filename: 'text.txt' },
    { text: 't', __line: 2, __filename: 'text.txt' },
    { text: '\nDATA1   \nDATA2\nDATA3\n    ',__filename: 'text.txt' }
  ];

  data.forEach((d,i) => {
    setTimeout(() => {
      split.write(i == 2 ? d : {text:d,__filename:'text.txt'});
      if (i == data.length-1)
        split.end();
    });
  });

  const d = await split.pipe(etl.expand()).promise();
  t.same(d,expected,'splits on a');
});