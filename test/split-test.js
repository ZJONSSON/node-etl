var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert');

var data = [
  'here are\nso',
  'me chunks\n',
  'of data\nDATA1   \nDATA2\nDATA3\n    '
];

describe('split',function() {
  it('splits newlines',function() {

    var expected = [
      { text: 'here are', __line: 0, __filename: 'text.txt' },
      { text: 'some chunks', __line: 1, __filename: 'text.txt' },
      { text: 'of data', __line: 2, __filename: 'text.txt' },
      { text: 'DATA1', __line: 3, __filename: 'text.txt' },
      { text: 'DATA2', __line: 4, __filename: 'text.txt' },
      { text: 'DATA3', __line: 5, __filename: 'text.txt' }
    ];

    var split = etl.split();

    data.forEach(function(d,i) {
      setTimeout(function() {
        split.write(i == 2 ? d : {text:d,__filename:'text.txt'});
        if (i == data.length-1)
          split.end();
      });
    });

    return inspect(split.pipe(etl.expand()))
      .then(function(d) {
        assert.deepEqual(d,expected);
      });
  });

  it('splits custom',function() {
    var split = etl.split('a');

    var expected = [
      { text: 'here', __line: 0, __filename: 'text.txt' },
      { text: 're\nsome chunks\nof d', __line: 1, __filename: 'text.txt' },
      { text: 't', __line: 2, __filename: 'text.txt' },
      { text: '\nDATA1   \nDATA2\nDATA3\n    ',__filename: 'text.txt' }
    ];

    data.forEach(function(d,i) {
      setTimeout(function() {
        split.write(i == 2 ? d : {text:d,__filename:'text.txt'});
        if (i == data.length-1)
          split.end();
      });
    });

    return inspect(split.pipe(etl.expand()))
      .then(function(d) {
        assert.deepEqual(d,expected);
      });
  });
});