var etl = require('../index'),
    assert = require('assert'),
    path = require('path'),
    data = require('./data');

describe('csv_parser',function() {
  it('parses (and transforms) incoming data',function() {
    var csv = etl.csv_parser({sanitize: true, transform:{dt:function(d) { return new Date(d);}}});
    etl.file(path.join(__dirname,'test.csv')).pipe(csv);

    // Adjust expected values to the csv
    var expected = data.copy().map(function(d) {
      d.__line = d.__line +1;
      d.__filename = 'test.csv';

      // Clear out __path and text as they are volatile
      d.__path = undefined;
      d.text = undefined;
      
      return d;
    });

    
    return csv.pipe(etl.expand())
      .promise()
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