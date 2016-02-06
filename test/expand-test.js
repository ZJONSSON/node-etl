var etl = require('../index'),
    assert = require('assert'),
    data = require('./data');


describe('expanded',function() {
  describe('without',function() {
    it('prototype keys are not visible',function() {
      return data.stream({clone:true})
        .pipe(etl.map())
        .promise()
        .then(function(d) {
          d.forEach(function(d) {
            assert.deepEqual(Object.keys(d),{});
          });
        });
    });
  });

  describe('with',function() {
    it('prototype keys become visible',function() {
      return data.stream({clone:true})
        .pipe(etl.expand())
        .promise()
        .then(function(d) {
          assert.deepEqual(d,data.data);
        });
    });
  });

  describe('using uppercase',function() {
    var ukeys = Object.keys(data.data[0]).map(function(key) {
      return key.toUpperCase();
    });

    it('transforms keys',function() {
      return data.stream({clone:true})
        .pipe(etl.expand('uppercase'))
        .promise()
        .then(function(d) {
          d.forEach(function(d) {
            assert.deepEqual(Object.keys(d),ukeys);
          });
        });
    });
  });

  describe('using lowercase',function() {
    var lkeys = Object.keys(data.data[0]).map(function(key) {
      return key.toLowerCase();
    });

    it('transforms keys',function() {
      return data.stream({clone:true})
        .pipe(etl.expand('lowercase'))
        .promise()
        .then(function(d) {
          d.forEach(function(d) {
            assert.deepEqual(Object.keys(d),lkeys);
          });
        });
    });
  });

  describe('using custom transform',function() {

    function customTransform(key) {
      if (key == '__line') return;
      return 'custom_'+key;
    }

    var ckeys = Object.keys(data.data[0])
      .filter(function(key) {
        return key !== '__line';
      })
      .map(function(key) {
        return 'custom_'+key;
      });

    it('transforms keys',function() {
      return data.stream({clone:true})
        .pipe(etl.expand(customTransform))
        .promise()
        .then(function(d) {
          d.forEach(function(d) {
            assert.deepEqual(Object.keys(d),ckeys);
          });
        });
    });
  });


  
});