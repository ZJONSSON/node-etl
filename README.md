ETL is a collection of stream based components that can be piped together to form a complete ETL pipeline with buffering, bulk-inserts and concurrent database streams. See the `test` directory for live examples.

```
npm install etl
```

Introductory example: csv -> elasticsearch 

```js
fs.createReadStream('scores.csv')
  // parse the csv file
  .pipe(etl.csv())
  // map `date` into a javascript date and set unique _id
  .pipe(etl.map(d => {
    d._id = d.person_id;
    d.date = new Date(d.date);
    return d;
  })
  // collect 1000 records at a time for bulk-insert
  .pipe(etl.collect(1000))  
  // upsert records to elastic with max 10 concurrent server requests
  .pipe(etl.elastic.index(esClient,'scores','records',{concurrency:10}))
  // Switch from stream to promise chain and report done or error
  .promise()
  .then( () => console.log('done'), e => console.log('error',e));
```

## API Reference
* [Parsers](#parsers)
* [Transforms](#transforms)
* [Database upload](#databases)
  * [Mongodb](#mongodb)
  * [Mysql](#mysql)
  * [Elasticsearch](#elasticsearch)
* [Utilities](#utilities)

Please note that the cluster API has changed slightly in version `0.3.x`

### Parsers 

<a name="csv" href="#csv">#</a> etl.<b>csv</b>([<i>options</i>])

Parses incoming csv text into individual records.  For parsing options see [csv-parser](https://www.npmjs.com/package/csv-parser).  If  `options` contains a `transform` object containing functions, those functions will be applied on the values of any matching keys in the data.  If a key in the `transform` object is set to `null` then value with that key will not be included in the downstream packets.  If option `santitize` is set to true, then headers will be trimmed, converted to lowercase, spaces converted to underscore and any blank values (empty strings) will be set to undefined.

A `header` event will be emitted when headers have been parsed. An event listener can change the headers in-place before the stream starts piping out parsed data.

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
  })
  .pipe(...)
```

<a name="fixed" href="#fixed">#</a> etl.<b>fixed</b>(<i>layout</i>)

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
  .pipe(...)
```

### Transforms

<a name="map" href="#map">#</a> etl.<b>map</b>(<i>fn</i>)

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

<a name="split" href="#split">#</a> etl.<b>split</b>([<i>symbol</i>])

Splits the `text` of an incoming stream by the provided symbol into separate packets. The default symbol is a newline, i.e. splitting incoming text into invididual lines.  If the supplied symbol is never found, the incoming stream will be buffered until the end, where all content is sent in one chunk.  The prototype of each packet is the first incoming packet for each buffer.

Example

```js
// Reads the file and splits `text` by newline
etl.file('text.txt')
  .pipe(etl.split())
```

<a name="cut" href="#cut">#</a> etl.<b>cut</b>(<i>maxLength</i>)

Cuts incoming text into text snippets of a given maximum length and pushes downstream.

<a name="collect" href="#collect">#</a> etl.<b>collect</b>(<i>count</i> [,<i>maxDuration</i>] [,<i>maxTextLength</i>])

Buffers incoming packets until they reach a specified count and then sends the array of the buffered packets downstream. At the end of the incoming stream, any buffered items are shipped off even though the count has not been achieved.   This functionality can come in handy when preparing to bulk-insert into databases.   An optional `maxDuration` can be supplied to signal the maximum amount of time (in ms) that can pass from a new collection starting until the contents are pushed out.  This can come in handy when processing real time sporadic data where we want the collection to flush early even if the count has not been reached.  Finally defining an optional `maxTextLength` will cause the stream to keep track of the stringified length of the puffer and push when it goes over the limit. 

Example:

```js
var data = [1,2,3,4,5,6,7,8,9,10,11],
    collect = etl.collect(3);

data.forEach(collect.write.bind(collect));
collect.end();

collect.pipe(etl.inspect());
// Should show 4 packets: [1,2,3]   [4,5,6]    [7,8,9]   [10,11]
```

<a name="expand" href="#expand">#</a> etl.<b>chain</b>(<i>fn</i>)
Allows a custom subchain of streams to be injected into the pipe using duplexer2. You must provide a custom function that returns the outbound stream, after receiving the inbound stream as the first function argument.

Example:

```js
etl.file('test.csv')
  .pipe(etl.chain(function(inbound) {
    return inbound
      .pipe(etl.csv())
      .pipe(etl.collect(100));
  }))
  .pipe(console.log);
```

<a name="expand" href="#expand">#</a> etl.<b>expand</b>([<i>convert</i>])

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

<a name="stringify" href="#stringify">#</a> etl.<b>stringify</b>([<i>indent</i>] [,<i>replacer</i>] [,<i>newline</i>])

Transforms incoming packets into JSON stringified versions, with optional `indent` and `replacer`.  If `newline` is true a `\n` will be appended to each packet.

<a name="inspect" href="#inspect">#</a> etl.<b>inspect</b>([<i>options</i>])

Logs incoming packets to console using `util.inspect` (with optional custom options)

<a name="timeout" href="#timeout">#</a> etl.<b>timeout</b>([<i>ms</i>])

A passthrough transform that emits an error if no data has passed through for at least the supplied milliseconds (`ms`).  This is useful to manage pipelines that go stale for some reason and need to be errored out for further inspection.

Example:

```js
// Here the pipeline times out if no data has been flowing to the file for at least 1 second
mongocollection.find({})
  .pipe(lookup)
  .timeout(1000)
  .pipe(etl.toFile('test.json'))
```


### Databases

#### Mongo

<a name="mongoinsert" href="#mongoinsert">#</a> etl.mongo.<b>insert</b>(<i>collection</i> [,<i>options</i>])

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

<a name="mongoupdate" href="#mongoupdate">#</a> etl.mongo.<b>update</b>(<i>collection</i> [,<i>keys</i>] [,<i>options</i>])

Updates incoming data by building a `criteria` from an array of `keys` and the incoming data.   Supplied collection can be a promise and results can be pushed downstream by declaring `pushResults : true`.   The options are passed to mongo so defining `upsert : true` in options will ensure an upsert of the data.

Example

```js
// The following updates incoming persons using the personId as a criteria (100 records at a time)

etl.file('test.csv')
  .pipe(etl.csv())
  .pipe(etl.collect(100))
  .pipe(mongo.update(collection,['personId']));

```

#### Mysql

<a name="mysqlupsert" href="#mysqlupsert">#</a> etl.mysql.<b>upsert</b>(<i>pool</i>, <i>schema</i>, <i>table</i> [,<i>options</i>])

Pipeline that scripts incoming packets into bulk sql commands (`etl.mysql.script`) and executes them (`etl.mysql.execute`) using the supplied mysql pool. When the size of each SQL command reaches `maxBuffer` (1mb by default) the command is sent to the server.  Concurrency is managed automatically by the mysql poolSize. 


<a name="mysqlscript" href="#mysqlscript">#</a> etl.mysql.<b>script</b>(<i>pool</i>, <i>schema</i>, <i>table</i> [,<i>options</i>])

Collects data and builds up a mysql statement to insert/update data until the buffer is more than `maxBuffer` (customizable in options).  Then the maxBuffer is reached, a full sql statement is pushed downstream.   When the input stream has ended, any remaining sql statement buffer will be flushed as well.

The script stream first establishes the column names of the table being updated, and as data comes in - it uses only the properties that match column names in the table.

<a name="mysqlexecute" href="#mysqlexecute">#</a> etl.mysql.<b>execute</b>(<i>pool</i> [,<i>options</i>])

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

#### Elasticsearch

<a name="elasticbulk" href="#elasticbulk">#</a> etl.elastic.<b>bulk</b>(<i>action</i>, <i>client</i>, [,<i>index</i>] [,<i>type</i>] [,<i>options</i>])

Transmit incoming packets to elasticsearch, setting the appropriate meta-data depending on the default action. Each incoming packet can be an array of documents (or a single document).  Each document should contain a unique `_id`.   To bulk documents together use `etl.collect(num)` above the elastic adapter.

The results are not pushed downstream unless `pushResults` is defined in the options. The body of the incoming data is included in the results, allowing for easy resubmission upon version conflicts. By defining option `pushErrors` as `true` only errors will be pushed downstream.  Maximum number of concurrent connections can be defined as option `concurrency`.  If `maxRetries` is defined in options, an error response from the server will result in retries up to the specified limit - after a wait of `retryDelay` or 30 seconds.  This can be useful for long-running upsert operations that might encounter the occasional network or timeout errors along the way.  If `debug` is defined true, the error message will be printed to console before retrying.  `maxRetries` should only be used for data with user-supplied `_id` to prevent potential duplicate records on retry.

If index or type are not specified when the function is called,  they will have to be supplied as `_index` and `_type` properties of each document. The bulk command first looks for `_source` in the document to use as a document body (in case the document originates from a scroll command), alternatively using the document itself as a body.

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

Another example shows how one index can be copied to another, retaining the `_type` of each document:

```js
console.time('copy');
etl.elastic.scroll(esClient,{index: 'index.a', size: 5000})
  .pipe(etl.collect(1000))
  .pipe(etl.elastic.index(esClient,'index.b',null,{concurrency:10}))
  .promise()
  .then(function() {
    console.timeEnd('copy');
  });
```

If `custom` action is selected, each packet must be the raw metadata to be sent to elasticsearch with the optional second line stored in property `body`


### Cluster

<a name="clusterschedule" href="#clusterschedule">#</a> etl.cluster.<b>schedule</b>(<i>list</i> [,<i>options</i>])

Schedules a list (array) of tasks to be performed by workers.  Returns a promise on the completion of all the tasks.   Number of threads will default to number of cpus, but can also be specified as `threads` in options.  If `reportingInterval` is defined in options, the current progress (as reported) will be shown at the defined interval.

  If reporting interval is defined - progress will be reported in console.log.Should only be run from the master thread.  

<a name="clusterprocess" href="#clusterprocess">#</a> etl.cluster.<b>process</b>(<i>data</i>) 

This function should be overwritten in the worker to perform each task.  The function should either run a value (for synchronous execution) or a Promise.  Any errors will be sent to the master and result in a `throw`

<a name="clusterreport" href="#clusterreport">#</a> etl.cluster.<b>report</b>(<i>num</i>)

This function sends a numerical value representing progress up to the master (for reporting).  

### Utilities

<a name="tostream" href="#tostream">#</a> etl.<b>toStream</b>(<i>data</i>)

A helper function that returns a stream that is initialized by writing every element of the supplied data (if array) before being ended.  This allows for an easy transition from a known set of elements to a flowing stream with concurrency control.

<a name="file" href="#file">#</a> etl.<b>file</b>(<i>data</i> [,<i>options</i>])

Opens up a `fileStream` on the specified file and pushes the content downstream.  Each packet has a base prototype of of either an  optional `info` object provided in options or the empty object.  The following properties are defined for each downstream packet:  `__filename`, '__path' and `text` containing incremental contents of the file.

The optional `info` object allows setting generic properties that will, through inheritance, be available in any derived packets downstream.

Example:

```js
// each packet will contain  properties context, __filename, __path and text
etl.file('text.txt',{info: {context: 'test'}})
```

<a name="tofile" href="#tofile">#</a> etl.<b>toFile</b>(<i>filename</i>)

This is a convenience wrapper for `fs.createWriteStream` that returns a `streamz` object.  This allows appending `.promise()` to capture the finish event (or error) in a promise form.

Example:

```js
etl.toStream([1,2,3,4,5])
  .pipe(etl.stringify(0,null,true))
  .pipe(etl.toFile('/tmp/test.txt'))
  .promise()
  .then(function() {
    console.log('done')
  })
  .catch(function(e) {
    console.log('error',e);
  })
```
