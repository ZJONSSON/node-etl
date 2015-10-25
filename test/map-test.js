var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    data = require('./data');

 var expected = data.data.map(function(d) {
  return {
    full_name : d.name,
    AGE : d.age
  };
});    

describe('map',function() {
  describe('with an object',function() {
    it('maps correctly',function() {
      var map = etl.map({
        full_name : 'name',
        AGE : 'age'
      }); 

      data.getCloneData().pipe(map);

      return inspect(map.pipe(etl.expand()))
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });

  describe('with a custom function',function() {
    it('maps correctly',function() {
      var map = etl.map(function(d) {
       return {
          full_name : d.name,
          AGE : d.age
        };
      });
      
      data.getCloneData().pipe(map);

      return inspect(map.pipe(etl.expand()))
        .then(function(d) {
          assert.deepEqual(d,expected);
        });
    });
  });
    
});