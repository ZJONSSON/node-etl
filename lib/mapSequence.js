const chain = require('./chain');
const streamz = require('streamz');

module.exports = function() {
  const args = [...arguments];
  let inCount = 0;
  let outCount = -1;
  let buffer = {};
  let next;
  
  const transform = streamz.apply(this,args);
  const maxSequence = transform.options.maxSequence || 1000;
  
  const mapSequence = chain(incoming => {
    return incoming.pipe(streamz(function(d,cb) {
      Object.defineProperty(d,'__mapSequence',{value: inCount++, writable: true, enumerable: false, configurable: true});
      this.push(d);
      if (Object.keys(buffer).length > maxSequence) {
        mapSequence.paused = true;
        next = cb;
      } else {
        cb();
      }
    }))
    .pipe(transform)
    .pipe(streamz(function(d) {
      buffer[d.__mapSequence] = d;
      delete d.__mapSequence;  
  
      while (buffer[outCount+1]) {
        outCount++;
        this.push(buffer[outCount]);
        delete buffer[outCount];
      }
      if (next && Object.keys(buffer).length <= maxSequence) {
        mapSequence.paused = false;
        next();
        next = undefined;
      }
    }));
  });
  
  return mapSequence;
};