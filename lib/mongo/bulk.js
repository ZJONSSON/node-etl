const Streamz = require('streamz');
const Promise = require('bluebird');

class Bulk extends Streamz {
  constructor(_c,collection,keys,options) {
    super(_c, null, options);
    
    if (isNaN(_c)) {
      options = keys;
      keys = collection;
      collection = _c;
      _c = undefined;
    }

    if (keys === undefined)
      throw new Error('Missing Keys');

    this.collection = Promise.resolve(collection);
    this.options = options || {};
    this.keys = [].concat(keys);
  }
  
  async _fn(d,cb) {
    const collection = await this.collection;
    const bulk = collection.initializeUnorderedBulkOp();

    [].concat(d || []).forEach(d => {
      const criteria = this.keys.reduce((p,key) => {
        const keyPieces = key.split('.');
        const value = keyPieces.reduce((a, b) => {
          if (a[b] === undefined) {
            throw new Error('Key "' + b + '" not found in data ' + JSON.stringify(d));
          }
          return a[b];
        }, d);

        //if query referencing array, use $elemMatch instead of equality match to prevent issues with upsert
        if(keyPieces[0] == '$push' || keyPieces[0] == '$addToSet')  {
          const arrayProp = keyPieces[1];
          if(p[arrayProp] === undefined) {
            p[arrayProp] = {$elemMatch:{}};
          }
          keyPieces.splice(0,2);
          p[arrayProp]['$elemMatch'][keyPieces.join('.')] = value;
        } else {
          //check if key starts with '$' to remove operator from query key
          if(key.charAt(0) == '$') {
            key = key.substring(key.indexOf('.') + 1);
          }
          p[key] = value;
        }
        return p;
      },{});

      let op = bulk.find(criteria);

      if (this.options.upsert) {
        op = op.upsert();
      }

      op.updateOne(d);
    });

    bulk.execute(this.options,(err,d) => {
      console.log('inserted', d.nInserted,'upserted', d.nUpserted, 'nMatched', d.nMatched, 'upserted', d.upserted,  err);
      cb(err,this.options.pushResult && d);
    });
  }
}

module.exports = Bulk;
