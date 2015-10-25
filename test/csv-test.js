var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    path = require('path'),
    data = require('./data');

describe('csv_parser',function() {
  it('parses (and transforms) incoming data',function() {
    var csv = etl.csv_parser({transform:{dt:function(d) { return new Date(d);}}});

    etl.file(path.join(__dirname,'test.csv')).pipe(csv);

    // Adjust expected values to the csv
    var expected = data.data.map(function(d) {
      var obj = {};
      for (var key in d)
        obj[key] = d[key];

      obj.__line = obj.__line +1;
      obj.__filename = 'test.csv';

      // Clear out __path and text as they are volatile
      obj.__path = undefined;
      obj.text = undefined;
      
      return obj;
    });

    
    return inspect(csv.pipe(etl.expand()))
      .then(function(d) {

        // Clear out __path and text as they are volatile
        d.forEach(function(d) {
          d.__path = undefined;
          d.text = undefined;
        });

        assert.deepEqual(d,expected);
        
      });
  });
});