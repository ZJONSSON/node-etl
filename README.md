ETL is a collection of stream based components that can be piped together to form a complete ETL pipeline with buffering, bulk-inserts and concurrent database streams.

```
npm install etl
```


### `etl.file(path,[options])`
Opens up a `fileStream` on the specified file and pushes the content downstream.  Each packet has a base prototype of of either an  optional `info` object provided in options or the empty object.  The following properties are defined for each downstream packet:  `__filename`, '__path' and `text` containing incremental contents of the file.

The optional `info` object allows setting generic properties that will, through inheritance, be available in any derived packets downstream.

Example:

```js
// each packet will contain  properties context, __filename, __path and text
etl.file('text.txt',{info: {context: 'test'}})
```

### `etl.split([symbol])`
Splits the `text` of an incoming stream by the provided symbol into separate packets. The default symbol is a newline, i.e. splitting incoming text into invididual lines.  If the supplied symbol is never found, the incoming stream will be buffered until the end, where all content is sent in one chunk.  The prototype of each packet is the first incoming packet for each buffer.

Example

```js
// Reads the file and splits `text` by newline
etl.file('text.txt')
  .pipe(etl.split())
```

### `etl.fixed(layout)`
Parses incoming text into objects using a fixed width layout.   The layout should be an object where each key is a field name that should be parsed, containing an object with `start`, `end` and/or `length`.  Alternatively each key can just have a number, which will be deemed to be `length`.   If a key contains a `transform` function, it will be applied to the parsed value of that key.  The layout can also be supplied as an array where instead of an object key the fieldname is defined using property `field` in each element.

The length of a single record will be determined by the highest `end` or `start+length` position.

Each packet will contain `__line`, a number signifying the sequential position of the record

Example

```js
// Reads the file and parses into individual records.  Each packet will contain the
// following properties:  __filename, __path, __line, firstCol, nextCol, lastCol.
// nextCol values are coerced into numbers here

var layout = {
  firstCol: {start: 0, end:10},
  nextCol: {length:5, transform: Number},
  lastCol: 5
}

etl.file('test.txt')
  .pipe(etl.fixed(layout))
```

### `etl.cut(maxLength)`
Cuts incoming text into text snippets of a given maximum length and pushes downstream.

### `etl.csv_parser([options])`
Parses incoming csv text into individual records.  For parsing options see [csv-parser](https://www.npmjs.com/package/csv-parser).  If  `options` contains a `transform` object containing functions, those functions will be applied on the values of any matching keys in the data.  If a key in the `transform` object is set to `null` then value with that key will not be included in the downstream packets.

Example

```js
// Here the test.csv is parsed but field dt is converted to date.  Each packet will 
// contain the following properties:  __filename, __path, __line and csv fields
etl.file('test.csv')
  .pipe(etl.csv({
    transform: {
      dt : function(d) {
        return new Date(d);
      }
    }
  });
```

### `etl.collect(count)`
Buffers incoming packets until they reach a specified count and then sends the array of the buffered packets downstream. At the end of the incoming stream, any buffered items are shipped off even though the count has not been achieved.   This functionality can come in handy when preparing to bulk-insert into databases.

Example:

```js
var data = [1,2,3,4,5,6,7,8,9,10,11],
    collect = etl.collect(3);

data.forEach(collect.write.bind(collect));
collect.end();

collect.pipe(etl.inspect());
// Should show 4 packets: [1,2,3]   [4,5,6]    [7,8,9]   [10,11]
```

### `etl.expand([convert])`
Throughout the etl pipeline new packets are generated with incoming packets as prototypes (using `Object.create`).  This means that inherited values are not enumerable and will not show up in stringification by default (although they are available directly).  `etl.expand()` loops through all keys of an incoming packet and explicitly sets any inherited values as regular properties of the object

Example:

```js
// In this example the `obj` would only show property `c` in stringify
// unless expanded first
var base = {a:1,b:'test'},
    obj = Object.create(base),
    s = etl.streamz();

obj.c = 'visible';
s.end(obj);

s.pipe(etl.expand())
  .pipe(etl.inspect());
```

The optional `convert` option will modify the keys of the new object.  If `convert` is `'uppercase'` or `'lowercase'` the case of the keys will be adjusted accordingly.  If `convert` is a function it will set the keyname to the function output (and if output is `undefined` that particular key will not be included in the new object)

### `etl.map(fn)`
The base [`streamz`](http://github.com/ZJONSSON/streamz) object is exposed as `etl.map` to provide quick ability to do mappings on the fly.  Anything `pushed` inside the custom function will go downstream.  Also if the function has a return value (or a promise with a return value) that is `!== undefined` that return value will be pushed as well.

Example

```js
// In this example names and ages and normalized to fresh objects pushed
// downstream.  (If we wanted to retain metadata we would use Object.create(d))

etl.file('test.csv')
  .pipe(etl.csv())
  .pipe(etl.map(function(d) {
    this.push({name: d.name_1, age: d.age_1});
    this.push({name: d.name_2, age: d.age_2});
    this.push({name: d.name_3, age: d.age_3});
  }))
```

### `etl.mongo.insert(collection,[options])`
Inserts incoming data into the provided mongodb collection.  The supplied collection can be a promise on a collection.  The options are passed on to both streamz and the mongodb insert comand.  By default this object doesn't push anything downstream, but it `pushResults` is set as `true` in options, the results from mongo will be pushed downstream.

Example

```js
// The following inserts data from a csv, 10 records at a time into a mongo collection
// ..assuming mongo has been promisified

var db = mongo.ConnectAsync('mongodb://localhost:27017');
var collection = db.then(function(db) {
  return db.collection('testcollection');
});

etl.file('test.csv')
  .pipe(etl.csv())
  .pipe(etl.collect(10))
  .pipe(mongo.insert(collection));

```


### `etl.mongo.update(collection,keys,[options])`
Updates incoming data by building a `criteria` from an array of `keys` and the incoming data.   Supplied collection can be a promise and results can be pushed downstream by declaring `pushResults : true`.   The options are passed to mongo so defining `upsert : true` in options will ensure an upsert of the data.

Example

```js
// The following updates incoming persons using the personId as a criteria

etl.file('test.csv')
  .pipe(etl.csv())
  .pipe(mongo.update(collection,['personId']));

```

### `etl.mysql.script(pool,schema,table,[options])`
Collects data and builds up a mysql statement to insert/update data until the buffer is more than `maxBuffer` (customizable in options).  Then the maxBuffer is reached, a full sql statement is pushed downstream.   When the input stream has ended, any remaining sql statement buffer will be flushed as well.

The script stream first establishes the column names of the table being updated, and as data comes in - it uses only the properties that match column names in the table.

### `etl.mysql.execute(pool,[options])`
This component executes any incoming packets as sql statements using connections from the connection pool. The maximum concurrency is automatically determined by the mysql poolSize, using the combination of callbacks and Promises.

Example:

```js
// The following bulks data from the csv into sql statements and executes them with 
// a maximum of 4 concurrent connections

etl.file('test.csv')
  .pipe(etl.csv())
  .pipe(etl.mysql.script(pool,'testschema','testtable'))
  .pipe(etl.mysql.execute(pool,4))
```

### `etl.elastic.bulk(action,client,index,type,[options])`
Transmit incoming packets to elasticsearch, setting the appropriate meta-data depending on the default action. Each incoming packet can be an array of documents (or a single document).  Each document should contain a unique `_id`.   To bulk documents together use `etl.collect(num)` above the elastic adapter.

The results are not pushed downstream unless `pushResults` is defined in the options.  Maximum number of concurrent connections can be defined as option `concurrency`.

Available actions are also provided as separate api commands:

* `etl.elastic.index(client,index,type,[options])`
* `etl.elastic.update(client,index,type,[options])`
* `etl.elastic.upsert(client,index,type,[options])`
* `etl.elastic.delete(client,index,type,[options])`
* `etl.elastic.custom(client,index,type,[options])`

Example

```js
etl.file('test.csv')
  .pipe(etl.csv())
  .pipe(etl.collect(100))
  .pipe(etl.elastic.index(esClient,'testindex','testtype'))
```

If `custom` action is selected, each packet must be the raw metadata to be sent to elasticsearch with the optional second line stored in property `body`

### `etl.stringify([indent],[replacer])`
Transforms incoming packets into JSON stringified versions, with optional `indent` and `replacer`

### `etl.inspect([options])`
Logs incoming packets to console using `util.inspect` (with optional custom options)