var etl = require('../index'),
    assert = require('assert'),
    path = require('path'),
    data = require('./data');

describe('file',function() {
  var file = etl.file(path.join(__dirname,'test.txt')).promise();
    
  it('reads data',function() {
    return file.then(function(d) {
      assert.equal(d[0].text,data.fixed.join(''));
    });
  });

  it('contains file information',function() {
    return file.then(function(d) {
      assert.equal(d[0].__filename,'test.txt');
    });
  });

  it('can be piped',function() {
    var expected = data.copy().map(function(d) {
      d.__path = undefined;
      d.category = 'A';
      return d;
    });

    return etl.file(path.join(__dirname,'test.txt'),{info:{category:'A'}})
      .pipe(etl.fixed(data.layout))
      .pipe(etl.expand())
      .promise()
      .then(function(d) {
        d.forEach(function(d) {
          d.__path = undefined;
        });
        assert.deepEqual(d,expected);
      });
  });
});