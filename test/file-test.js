var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    path = require('path'),
    data = require('./data');

describe('file',function() {
  var file= etl.file(path.join(__dirname,'test.txt')),
      res = inspect(file);
    
  it('reads data',function() {
    return res.then(function(d) {
      assert.equal(d[0].text,data.fixed.join(''));
    });
  });

  it('contains file information',function() {
    return res.then(function(d) {
      assert.equal(d[0].__filename,'test.txt');
    });
  });

  it('can be piped',function() {
    var file= etl.file(path.join(__dirname,'test.txt'),{info:{category:'A'}});

    var expected = data.data.map(function(d) {
      var obj = {};
      for (var key in d)
        obj[key] = d[key];
      obj.__path = undefined;
      obj.category = 'A'
      return obj;
    });

    inspect(file.pipe(etl.fixed(data.layout)).pipe(etl.expand()))
      .then(function(d) {
        d.forEach(function(d) {
          d.__path = undefined;
        });
        assert.deepEqual(d,expected);
      });
  });
});