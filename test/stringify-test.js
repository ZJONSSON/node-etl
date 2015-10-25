var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert');


var data = [{a:1,b:'test1'},{a:2,b:'test2'}];

function dataStream() {
  var s = etl.streamz();
  data.forEach(s.write.bind(s));
  s.end();
  return s;
}

describe('stringify',function() {
  it('pushes stringified object',function() {
    var stringify = etl.stringify();

    dataStream().pipe(stringify);

    var expected = [ '{"a":1,"b":"test1"}', '{"a":2,"b":"test2"}' ];

    return inspect(stringify)
      .then(function(d) {
        assert.deepEqual(d,expected);
      });
  });

  it('provides optional indent',function() {
    var stringify = etl.stringify(2);

    dataStream().pipe(stringify);

    var expected = [ '{\n  "a": 1,\n  "b": "test1"\n}', '{\n  "a": 2,\n  "b": "test2"\n}' ];

    return inspect(stringify)
      .then(function(d) {
        assert.deepEqual(d,expected);
      });
  });

});