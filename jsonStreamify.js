'use strict';

const Transform = require('stream').Transform;
const PassThrough = require('stream').PassThrough;
const CoStream = require('./coStream');
const RecursiveIterable = require('./recursiveIterable');
const isReadableStream = require('./utils').isReadableStream;

class JSONStreamify extends CoStream {
    constructor(obj) {
        super(arguments);
    }

    * _makeGenerator(value) {
        let iter = new RecursiveIterable(value);
        let insertSeparator = false;
        for (let obj of iter) {
            if (obj.state === 'close') {
                yield this.push(obj.ctxType === Object ? '}' : ']');
                continue;
            }

            if (obj.state === 'open') {
                insertSeparator = false;
                yield this.push(obj.ctxType === Object ? '{' : '[');
                continue;
            }

            if (insertSeparator) {
                yield this.push(',');
            }

            if (obj.key && obj.ctxType !== Array) {
                yield this.push(JSON.stringify(obj.key) + ':');
            }

            if (isReadableStream(obj.value)) {
                if (!obj.value._readableState.objectMode) {
                    // Non Object Mode are emitted as a concatinated string
                    yield this.push('"');
                    yield obj.value.pipe(new Transform({
                        transform: (data, enc, next) => next(null, JSON.stringify(data.toString()).slice(1, -1))
                    }));
                    yield this.push('"');
                    continue;
                }

                // Object Mode Streams are emitted as arrays
                yield this.push('[');
                let first = true;
                const pass = new PassThrough();
                obj.value.pipe(new Transform({
                    objectMode: true,
                    transform: function(data, enc, next) {
                        if (!first) {
                            pass.push(',');
                        }
                        first = false;
                        new JSONStreamify(data).once('end', () => next(null, undefined)).pipe(pass, {
                            end: false
                        });
                    }
                })).once('end', () => pass.end()).resume();
                yield pass;
                yield this.push(']');
                continue;
            }

            if (obj.value instanceof Promise) {
                obj.value = obj.attachChild(new RecursiveIterable(yield obj.value)[Symbol.iterator]());
                insertSeparator = false;
                continue;
            }

            if (obj.state === 'value') {
                yield this.push(JSON.stringify(obj.value));
            }

            insertSeparator = true;
        }
    }
}

module.exports = JSONStreamify;