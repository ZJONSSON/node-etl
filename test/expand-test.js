var etl = require('../index'),
    inspect = require('./lib/inspect'),
    assert = require('assert'),
    data = require('./data');


describe('expanded',function() {
  describe('without',function() {
    it('prototype keys are not visible',function() {
      inspect(data.getCloneData().pipe(etl.streamz()))
        .then(function(d) {
          d.forEach(function(d) {
            assert.deepEqual(Object.keys(d),{});
          });
        });
    });
  });

  describe('with',function() {
    it('prototype keys become visible',function() {
      inspect(data.getCloneData().pipe(etl.expand()).pipe(etl.streamz()))
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
      inspect(data.getCloneData().pipe(etl.expand('uppercase')).pipe(etl.streamz()))
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
      inspect(data.getCloneData().pipe(etl.expand('lowercase')).pipe(etl.streamz()))
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
      inspect(data.getCloneData().pipe(etl.expand(customTransform)).pipe(etl.streamz()))
        .then(function(d) {
          d.forEach(function(d) {
            assert.deepEqual(Object.keys(d),ckeys);
          });
        });
    });
  });


  
});