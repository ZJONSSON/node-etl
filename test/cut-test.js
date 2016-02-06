var etl = require('../index'),
    assert = require('assert');

var data = [
  '1','2345678','9012345678','9'
];


var expected = [
  { text: '1234', __line: 0, __filename: 'text.txt' },
  { text: '5678', __line: 1, __filename: 'text.txt' },
  { text: '9012', __line: 2, __filename: 'text.txt' },
  { text: '3456', __line: 3, __filename: 'text.txt' },
  { text: '789', __line: 4, __filename: 'text.txt' },
];

describe('cut',function() {
  it('splits text to a maxLength',function() {  

    var cut = etl.cut(4);

    data.forEach(function(d,i) {
      setTimeout(function() {
        cut.write(i == 2 ? d : {text:d,__filename:'text.txt'});
        if (i == data.length-1)
          cut.end();
      });
    });

    return cut.pipe(etl.expand())
      .promise()
      .then(function(d) {
        assert.deepEqual(d[0],expected[0]);
      });
  });

});