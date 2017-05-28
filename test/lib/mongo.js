var Promise = require('bluebird'),
    mongo = require('mongodb'),
    data = require('../data');


Promise.promisifyAll(mongo);
Promise.promisifyAll(mongo.MongoClient);

module.exports = () => ({
  db : mongo.connectAsync('mongodb://localhost:27017/etl_tests'),

  getCollection : function(name) {
    var self = this,collection;

    if (this.collections[name])
      return Promise.resolve(this.collections[name]);
    
    return this.db
      .then(function(db) {
        return db.collection(name);
      })
      .then(function(d) {
        collection = self.collections[name] = d;
        return collection.removeAsync({});
      })
      .then(function() {
        return collection;
      });
  },

  collections: {},

  cleanup : function() {
    return this.db
      .then(function(db) {
        return Promise.map(Object.keys(this.collections),function(key) {
          return db.dropCollectionAsync(key);
        });
      });
  }
});

