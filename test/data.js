const PassThrough = require('stream').PassThrough;

const data = {
  data : [
    { text: 'Nathaniel Olson 52    1/10/2025',
      name: 'Nathaniel Olson',
      age: 52,
      dt: new Date('1/10/2025'),
      __line: 1,
      __filename: 'test.txt'
    },
    { text: 'Ann Ellis       36    10/2/2035',
      name: 'Ann Ellis',
      age: 36,
      dt: new Date('10/2/2035'),
      __line: 2,
      __filename: 'test.txt'
    },
    { text: 'Willie Freeman  38     4/1/2016',
      name: 'Willie Freeman',
      age: 38,
      dt: new Date('4/1/2016'),
      __line: 3,
      __filename: 'test.txt'
    }
  ],

  fixed: ['Nathaniel O','lson 52    1/10/202','5Ann Ellis       36  ','  10/2/203','5Willie F','reeman  38     4/1/20','16'],
  layout : { 
    name : 16,
    age : { length : 3,  transform: Number },
    dt : { length : 12, transform: function(d) { return new Date(d); } }
  }
};

data.copy = function() {
  return this.data.map(function(d) {
    return Object.keys(d).reduce(function(p,key) {
      p[key] = d[key];
      return p;
    },{});
  });
};

data.stream = function(options) {
  const s = PassThrough({objectMode:true});
  const data = this.copy();

  data.forEach(function(d,i) {
    setTimeout(function() {
      s.write(options && options.clone ? Object.create(d) : d);
      if (i == data.length-1)
        s.end();
    },i*10);
  });
  return s;
};


for (let key in data.data) 
  Object.freeze(data.data[key]);


module.exports = data;