# @inkarnaterpg/json-stream-stringify

[![NPM version][npm-image]][npm-url]
[![License][license-image]](LICENSE)

JSON Stringify as a Readable Stream with rescursive resolving of any readable streams and Promises.

## Breaking Changes in v3

- [Import formatting has changed](#usage)
- [CJS output added](#usage)

## Important and Breaking Changes in v2

- Completely rewritten from scratch
- 100% Code Coverage! 🎉
- Space argument finally implemented! 🎉
- ⚠️ Cycling is off by default
- ⚠️ JsonStreamStringify is now a constructor; use ``new`` operator
- Removed dependency on global JSON.stringify, Async/Await and Generators
- JsonStreamStringify is now compiled with babel to target ES5 (polyfills needed)
- Rejected promises and input stream errors are now handled and emitted as errors
- Added cyclic structure detection to prevent infinite recursion
- 🆕 Converted to Typescript

## Main Features

- Promises are rescursively resolved and the result is piped through JsonStreamStringify
- Streams (Object mode) are recursively read and output as arrays
- Streams (Non-Object mode) are output as a single string
- Output is streamed optimally with as small chunks as possible
- Cycling of cyclical structures and dags using [Douglas Crockfords cycle algorithm](https://github.com/douglascrockford/JSON-js)*
- Great memory management with reference release after processing and WeakMap/Set reference handling
- Optimal stream pressure handling
- Tested and runs on ES5**, ES2015**, ES2016 and later
- Bundled as UMD and Module

\* Off by default since v2  
\** With [polyfills](#usage)  

## Install

```bash
pnpm add @inkarnaterpg/json-stream-stringify
```

## Usage

Using Node v8 or later with ESM / Webpack / Browserify / Rollup

### No Polyfills, TS / ESM

```javascript
import { JsonStreamStringify } from 'json-stream-stringify';
```

### Polyfilled, TS / ESM

install @babel/runtime-corejs3 and corejs@3

```javascript
import { JsonStreamStringify }  from 'json-stream-stringify/polyfill';
import { JsonStreamStringify }  from 'json-stream-stringify/module.polyfill'; // force ESM
```

### Using Node >=8 / Other ES2015 UMD/CommonJS environments

```javascript
const { JsonStreamStringify } = require('json-stream-stringify'); // let module resolution decide UMD or CJS
const { JsonStreamStringify } = require('json-stream-stringify/umd'); // force UMD
const { JsonStreamStringify } = require('json-stream-stringify/cjs'); // force CJS
```

### Using Node <=6 / Other ES5 UMD/CommonJS environments

```javascript
const { JsonStreamStringify } = require('json-stream-stringify/polyfill');
const { JsonStreamStringify } = require('json-stream-stringify/umd/polyfill');
const { JsonStreamStringify } = require('json-stream-stringify/cjs/polyfill');
```

**Note:** This library is primarily written for LTS versions of NodeJS. Other environments are not tested.  
**Note on non-NodeJS usage:** This module depends on node streams library. Any Streams3 compatible implementation should work - as long as it exports a `Readable` class, with instances that looks like readable streams.  
**Note on Polyfills:** I have taken measures to minify global pollution of polyfills but this library **does not load polyfills by default** because the polyfills modify native object prototypes and it goes against the [W3C recommendations](https://www.w3.org/2001/tag/doc/polyfills/#advice-for-library-and-framework-authors).

## API

### `new JsonStreamStringify(value[, replacer[, spaces[, cycle]]])`  

Streaming conversion of ``value`` to JSON string.

#### Parameters

- ``value`` ``Any``  
  Data to convert to JSON.

- ``replacer`` Optional ``Function(key, value)`` or ``Array``  
  As a function the returned value replaces the value associated with the key. [Details](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#The_replacer_parameter)  
 As an array all other keys are filtered. [Details](https://developer.mozilla.org/en/docs/Web/JavaScript/Reference/Global_Objects/JSON/stringify#Example_with_an_array)

- ``spaces`` Optional ``String`` or ``Number``  
  A String or Number object that's used to insert white space into the output JSON string for readability purposes. If this is a Number, it indicates the number of space characters to use as white space. If this is a String, the string is used as white space. If this parameter is not recognized as a finite number or valid string, no white space is used.

- ``cycle`` Optional ``Boolean``  
  ``true`` enables cycling of cyclical structures and dags.  
  To restore cyclical structures; use [Crockfords Retrocycle method](https://github.com/douglascrockford/JSON-js) on the parsed object (not included in this module).

- ``maxDepth`` Optional ``Number``
  When ``maxDepth`` is set, objects nested deeper than the maxDepth will be parsed all at once.

#### Returns

- ``JsonStreamStringify`` object that exposes a [Streams3 interface](https://nodejs.org/api/stream.html#stream_class_stream_readable).

### jsonStreamStringify#path

Get current path begin serialized.

#### Returns

- ``Array[String, Number]``  
  Array of path Strings (keys of objects) and Numbers (index into arrays).  
  Can be transformed into an mpath with ``.join('.')``.  
  Useful in conjunction with ``.on('error', ...)``, for figuring out what path may have caused the error.

## Complete Example

```javascript
const { JsonStreamStringify } = require('json-stream-stringify');

const jsonStream = new JsonStreamStringify({
    // Promises and Streams may resolve more promises and/or streams which will be consumed and processed into json output
    aPromise: Promise.resolve(Promise.resolve("text")),
    aStream: ReadableObjectStream({a:1}, 'str'),
    arr: [1, 2, Promise.resolve(3), Promise.resolve([4, 5]), ReadableStream('a', 'b', 'c')],
    date: new Date(2016, 0, 2)
});
jsonStream.once('error', () => console.log('Error at path', jsonStream.stack.join('.')));
jsonStream.pipe(process.stdout);
```

Output (each line represents a write from jsonStreamStringify)

```text
{
"aPromise":
"text"
"aStream":
[
{
"a":
1
}
,
"str"
]
"arr":
[
1
,
2
,
3
,
[
4
,
5
]
,
"
a
b
c
"
],
"date":
"2016-01-01T23:00:00.000Z"
}
```

## Practical Example with Express + Mongoose

```javascript
app.get('/api/users', (req, res, next) => {
  res.type('json'); // Required for proper handling by test frameworks and some clients
  new JsonStreamStringify(Users.find().stream()).pipe(res);
});
```

### Why do I not get proper typings? (Missing .on(...), etc.)

install ``@types/readable-stream`` or ``@types/node`` or create your own ``stream.d.ts`` that exports a ``Readable`` class.

## License

[MIT](LICENSE)

Copyright (c) 2016 Faleij [faleij@gmail.com](mailto:faleij@gmail.com)

[npm-image]: https://img.shields.io/npm/v/@inkarnaterpg/json-stream-stringify.svg
[npm-url]: https://npmjs.org/package/@inkarnaterpg/json-stream-stringify
[license-image]: https://img.shields.io/badge/license-MIT-blue.svg
