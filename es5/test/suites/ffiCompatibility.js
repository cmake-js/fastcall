/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';

var ffi = require('../../lib').ffi;
var ref = ffi.ref;
var ArrayType = ffi.ArrayType;
var UnionType = ffi.UnionType;
var StructType = ffi.StructType;
var Library = ffi.Library;
var Callback = ffi.Callback;
var FfiFunction = ffi.Function;
var helpers = require('./helpers');
var assert = require('assert');
var _ = require('lodash');
var Promise = require('bluebird');
var async = Promise.coroutine;

describe('ffi compatibility', function () {
    var libPath = null;
    before(async( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return helpers.findTestlib();

                    case 2:
                        libPath = _context.sent;

                    case 3:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    })));

    it('supports required interface', function () {
        assert(_.isObject(ffi));
        assert(_.isObject(ref));
        assert(_.isFunction(ArrayType));
        assert(_.isFunction(UnionType));
        assert(_.isFunction(StructType));
        assert(_.isFunction(Library));
        assert(_.isFunction(Callback));
    });

    describe('functions', function () {
        it('supports multiple function definition', function () {
            var lib = ffi.Library(libPath, {
                mul: ['int', ['int', 'int']],
                getString: ['char*', []]
            });

            try {
                assert(_.isFunction(lib.mul));
                assert.equal(lib.mul(21, 2), 42);
                assert.equal(ref.readCString(lib.getString()), 'world');
            } finally {
                lib.release();
            }
        });

        describe('async', function () {
            it('supported explicitly', function (done) {
                var lib = ffi.Library(libPath, {
                    mul: ['int', ['int', 'int']]
                });

                try {
                    assert(_.isFunction(lib.mul));
                    assert(_.isFunction(lib.mul.async));
                    assert(_.isFunction(lib.mul.asyncPromise));
                    lib.mul.async(21, 2, function (err, res) {
                        setImmediate(function () {
                            return lib.release();
                        });
                        if (err) {
                            done(err);
                        }
                        try {
                            assert.equal(res, 42);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                } catch (err) {
                    lib.release();
                    done(err);
                }
            });

            it('supported in options', function (done) {
                var lib = ffi.Library(libPath, {
                    mul: ['int', ['int', 'int']]
                }, {
                    async: true
                });

                try {
                    assert(_.isFunction(lib.mul));
                    assert(_.isUndefined(lib.mul.async));
                    assert(_.isFunction(lib.mul.asyncPromise));
                    lib.mul(21, 2, function (err, res) {
                        setImmediate(function () {
                            return lib.release();
                        });
                        if (err) {
                            done(err);
                        }
                        try {
                            assert.equal(res, 42);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                } catch (err) {
                    lib.release();
                    done(err);
                }
            });
        });

        it('supports promises', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            var lib;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            lib = ffi.Library(libPath, {
                                mul: ['int', ['int', 'int']]
                            });
                            _context2.prev = 1;

                            assert(_.isFunction(lib.mul));
                            assert(_.isFunction(lib.mul.async));
                            assert(_.isFunction(lib.mul.asyncPromise));
                            _context2.t0 = assert;
                            _context2.next = 8;
                            return lib.mul.asyncPromise(21, 2);

                        case 8:
                            _context2.t1 = _context2.sent;

                            _context2.t0.equal.call(_context2.t0, _context2.t1, 42);

                        case 10:
                            _context2.prev = 10;

                            lib.release();
                            return _context2.finish(10);

                        case 13:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this, [[1,, 10, 13]]);
        })));
    });

    describe('callback', function () {
        describe('sync', function () {
            it('supports ffi-style callbacks', function () {
                var cbFunc = new FfiFunction('int', [ref.types.float, 'double']);
                var lib = ffi.Library(libPath, {
                    makeInt: ['int', ['float', 'double', cbFunc]]
                });

                try {
                    var v = 0.1;
                    var cb = new Callback('int', [ref.types.float, 'double'], function (float, double) {
                        return float + double + v;
                    });

                    var cb2 = cbFunc.toPointer(function (float, double) {
                        return float + double + v;
                    });

                    assert(_.isFunction(lib.makeInt));
                    assert(_.isFunction(lib.makeInt.async));
                    assert(_.isFunction(lib.makeInt.asyncPromise));
                    assert.deepEqual(_.keys(lib._library.callbacks), []);
                    assert.equal(lib.makeInt(19.9, 2, cb), 42);
                    v += 0.1;
                    assert.equal(lib.makeInt(19.9, 2, cb2), 44);
                    assert.deepEqual(_.keys(lib._library.callbacks), ['FFICallback0', 'FFICallback1']);
                } finally {
                    lib.release();
                }
            });
        });

        describe('async', function () {
            it('supports ffi-style callbacks', function (done) {
                var lib = ffi.Library(libPath, {
                    makeInt: ['int', ['float', 'double', 'pointer']]
                });

                try {
                    var cb = new Callback('int', [ref.types.float, 'double'], function (float, double) {
                        return float + double + 0.1;
                    });

                    assert(_.isFunction(lib.makeInt));
                    assert(_.isFunction(lib.makeInt.async));
                    assert(_.isFunction(lib.makeInt.asyncPromise));
                    assert.deepEqual(_.keys(lib._library.callbacks), []);
                    lib.makeInt.async(19.9, 2, cb, function (err, res) {
                        setImmediate(function () {
                            return lib.release();
                        });
                        if (err) {
                            done(err);
                        }
                        try {
                            assert.equal(res, 42);
                            assert.deepEqual(_.keys(lib._library.callbacks), ['FFICallback0']);
                            done();
                        } catch (err) {
                            done(err);
                        }
                    });
                } catch (err) {
                    lib.release();
                    done(err);
                }
            });
        });
    });

    describe('array', function () {
        var lib = void 0;
        var IntArray = void 0;
        before(function () {
            IntArray = new ArrayType('int');
            lib = ffi.Library(libPath, {
                isArrayNull: ['bool', [IntArray]]
            });
        });

        it('accepts non nulls', function () {
            var res = lib.isArrayNull(new IntArray([1, 2, 3]));
            assert(!res);
        });

        it('accepts null', function () {
            assert(lib.isArrayNull(null));
        });
    });

    describe('array of structs', function () {
        it('is supported', function () {
            var TRecWithArray = new StructType({
                values: new ArrayType(ref.types.long, 5),
                index: 'uint'
            });
            var TRecWithArrays = new ArrayType(TRecWithArray);
            var lib = ffi.Library(libPath, {
                incRecWithArrays: ['void', [TRecWithArrays, 'long']]
            });
            assert.deepEqual(_.keys(lib._library.structs), ['StructType0']);
            assert.deepEqual(_.keys(lib._library.arrays), []);

            try {
                var records = new TRecWithArrays([{
                    index: 4,
                    values: [3, 4, 5, 6, 7]
                }, new TRecWithArray({
                    index: 5,
                    values: [-3, -4, -5, -6, -7]
                })]);

                lib.incRecWithArrays(records, 2);
                assert.deepEqual(_.keys(lib._library.structs), ['StructType0']);
                assert.deepEqual(_.keys(lib._library.arrays), []);

                assert.equal(records.get(0).index, 5);
                assert.equal(records.get(1).index, 6);

                for (var i = 0; i < 5; i++) {
                    assert.equal(records.get(0).values.get(i), i + 4);
                    assert.equal(records.get(1).values.get(i), -2 - i);
                }
            } finally {
                lib.release();
            }
        });
    });

    describe('tagged union', function () {
        it('is supported', function () {
            var TUnion = new UnionType({
                a: 'short',
                b: 'int64',
                c: 'long'
            });
            var TTaggedUnion = new StructType({
                tag: 'char',
                data: TUnion
            });
            var lib = ffi.Library(libPath, {
                getValueFromTaggedUnion: ['int64', [ref.refType(TTaggedUnion)]]
            });
            assert.deepEqual(_.keys(lib._library.unions), []);
            assert.deepEqual(_.keys(lib._library.structs), ['StructType0']);

            try {
                var struct = new TTaggedUnion({
                    tag: 'b'.charCodeAt(0),
                    data: { b: 42 }
                });

                assert(_.isObject(struct));
                assert.equal(struct.tag, 'b'.charCodeAt(0));
                assert.equal(struct.data.b, 42);

                var result = lib.getValueFromTaggedUnion(struct.ref());
                assert.equal(result, 42);

                struct = new TTaggedUnion({
                    tag: 'b'.charCodeAt(0),
                    data: new TUnion({ b: 42 })
                });

                assert(_.isObject(struct));
                assert.equal(struct.tag, 'b'.charCodeAt(0));
                assert.equal(struct.data.b, 42);

                result = lib.getValueFromTaggedUnion(struct.ref());
                assert.equal(result, 42);

                assert.deepEqual(_.keys(lib._library.unions), []);
                assert.deepEqual(_.keys(lib._library.structs), ['StructType0']);
            } finally {
                lib.release();
            }
        });
    });

    describe('misc', function () {
        it('should support OpenCL clGetSupportedImageFormats method interface', function () {
            var ImageFormat = new StructType({
                imageChannelOrder: 'uint',
                imageChannelDataType: 'uint'
            });
            var types = {
                Context: ref.refType('void'),
                MemFlags: ref.types.uint64,
                MemObjectType: ref.types.uint,
                ImageFormatArray: new ArrayType(ImageFormat)
            };
            var lib = ffi.Library(libPath, {
                clGetSupportedImageFormats: ['int', [types.Context, types.MemFlags, types.MemObjectType, 'uint', types.ImageFormatArray, ref.refType('uint')]]
            });

            var clGetSupportedImageFormats = lib.clGetSupportedImageFormats;
            assert(_.isFunction(clGetSupportedImageFormats));

            var numFormats = ref.alloc('uint');
            var handle = ref.alloc('void');
            var res = clGetSupportedImageFormats(handle, 16, 4337, 0, null, numFormats);

            assert.equal(numFormats.deref(), 16);
            assert.equal(res, 4337);
        });

        describe('string', function () {
            it('should support "string" on interfaces', function () {
                var lib = ffi.Library(libPath, {
                    appendChar: ['void', [ref.types.CString, 'uint', 'char']],
                    readChar: ['char', ['string', 'uint']]
                });

                var appendChar = lib.appendChar;
                assert(_.isFunction(appendChar));
                var readChar = lib.readChar;
                assert(_.isFunction(readChar));

                var str = ref.allocCString('bubu');
                appendChar(str, 2, 'a'.charCodeAt(0));
                var newStr = ref.readCString(str);
                assert.equal(newStr, 'buau');
                assert.equal(readChar(str, 2), 'a'.charCodeAt(0));
                assert.equal(readChar('aba', 2), 'a'.charCodeAt(0));
            });

            it('should support array of "strings"', function () {
                var StringArray = new ArrayType('string');
                var lib = ffi.Library(libPath, {
                    concatStrings: ['void', [StringArray, 'uint', 'string']]
                });

                var concatStrings = lib.concatStrings;
                assert(_.isFunction(concatStrings));

                var arr = new StringArray(3);
                arr.set(0, 'bubu');
                arr.set(1, 'kitty');
                arr.set(2, 'fuck');
                var out = new Buffer(100);
                out.fill(0);

                concatStrings(arr, arr.length, out);
                assert.equal(ref.readCString(out), 'bubukittyfuck');
            });
        });
    });
});
//# sourceMappingURL=ffiCompatibility.js.map