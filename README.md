ETL is a collection of stream based components that can be piped together to form a complete ETL pipeline.


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
Parses incoming text into objects using a fixed width layout.   The layout should be an object where each key is a field name that should be parsed, containing an object with `start`, `end` and/or `length`.  Alternatively each key can just have a number, which will be deemed to be `length`.   If a key contains a `transform` function, it will be applied to the parsed value of that key.

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

### `etl.stringify([indent],[replacer])`
Transforms incoming packets into JSON stringified versions, with optional `indent` and `replacer`

### `etl.inspect([options])`
Logs incoming packets to console using `util.inspect` (with optional custom options)