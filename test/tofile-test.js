var etl = require('../index'),
    assert = require('assert'),
    path = require('path'),
    os = require('os');


var filename = path.join(os.tmpdir(),Number(new Date())+'.txt');

describe('toFile',function() {
  it('streams into a file and notifies when done',function() {
    return etl.toStream([1,2,[3,4]])
      .pipe(etl.stringify(0,null,true))
      .pipe(etl.toFile(filename))
      .promise();
  });

  it('can be read again',function() {
    return etl.file(filename)
      .promise()
      .then(function(d) {
        assert.equal(d[0].text,'1\n2\n[3,4]\n');
      })
  })

    
});