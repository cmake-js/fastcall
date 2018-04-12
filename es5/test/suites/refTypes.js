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

var fastcall = require('../../lib');
var Library = fastcall.Library;
var helpers = require('./helpers');
var assert = require('assert');
var _ = require('lodash');
var ref = fastcall.ref;
var Promise = require('bluebird');
var async = Promise.coroutine;
var StructType = fastcall.StructType;
var UnionType = fastcall.UnionType;
var ArrayType = fastcall.ArrayType;

describe('ref types', function () {
    var libPath = null;
    var lib = null;
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

    beforeEach(function () {
        lib = new Library(libPath);
    });

    afterEach(function () {
        lib.release();
    });

    describe('Struct', function () {
        it('could be created by plain object definition', function () {
            var result = lib.struct({
                TNumbers: {
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                }
            });

            assert.equal(result, lib);
            testStructInterface();
        });

        it('could be created from StructType', function () {
            var TNumbers = new StructType({
                a: 'short',
                b: 'int64',
                c: ref.types.long
            });
            var result = lib.struct({ TNumbers: TNumbers });

            assert.equal(result, lib);
            testStructInterface();
        });

        it('should supports C struct like syntax', function () {
            var result = lib.struct('struct TNumbers { short a; int64 b; long c; }');

            assert.equal(result, lib);
            testStructInterface();
        });

        describe('sync', function () {
            it('should get referenced by string syntax', function () {
                lib.struct({
                    TNumbers: {
                        a: 'short',
                        b: 'int64',
                        c: ref.types.long
                    }
                }).function('int64 mulStructMembers(TNumbers* numbers)');

                testMulStructMembersSync();
            });

            it('should get referenced by node-ffi-like syntax', function () {
                var TNumbers = new StructType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });
                lib.function({ mulStructMembers: ['int64', [ref.refType(TNumbers)]] });

                testMulStructMembersSync(true);
            });
        });

        describe('async', function () {
            it('should get referenced by string syntax', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                lib.struct({
                                    TNumbers: {
                                        a: 'short',
                                        b: 'int64',
                                        c: ref.types.long
                                    }
                                }).asyncFunction('int64 mulStructMembers(TNumbers* numbers)');

                                _context2.next = 3;
                                return testMulStructMembersAsync();

                            case 3:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            })));

            it('should get referenced by node-ffi-like syntax', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                var TNumbers;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                TNumbers = new StructType({
                                    a: 'short',
                                    b: 'int64',
                                    c: ref.types.long
                                });

                                lib.asyncFunction({ mulStructMembers: ['int64', [ref.refType(TNumbers)]] });

                                _context3.next = 4;
                                return testMulStructMembersAsync(true);

                            case 4:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            })));
        });

        function testStructInterface() {
            assert(_.isObject(lib.structs.TNumbers));
            assert(_.isFunction(lib.interface.TNumbers));
            assert(_.isFunction(lib.structs.TNumbers.type));
            assert.equal(lib.interface.TNumbers.struct, lib.structs.TNumbers);
            assert.equal(lib.interface.TNumbers.type, lib.structs.TNumbers.type);

            var ptr1 = lib.interface.TNumbers({
                a: 1,
                b: 2,
                c: 3
            });
            assert(ptr1 instanceof Buffer);
            assert.equal(ptr1.type, lib.structs.TNumbers.type);
            assert.equal(ptr1.struct, lib.structs.TNumbers);

            var numbers = lib.structs.TNumbers.type(ptr1);
            assert.equal(numbers.a, 1);
            assert.equal(numbers.b, 2);
            assert.equal(numbers.c, 3);
        }

        function testMulStructMembersSync(noname) {
            assert(_.isFunction(lib.interface.mulStructMembers));

            var result = void 0;
            if (!noname) {
                assert(_.isFunction(lib.interface.TNumbers));
                assert.strictEqual(ref.derefType(lib.functions.mulStructMembers.args[0].type), lib.structs.TNumbers.type);
                var ptr = lib.interface.TNumbers({
                    a: 1,
                    b: 2,
                    c: 3
                });
                result = lib.interface.mulStructMembers(ptr);
            } else {
                var TNumbers = new StructType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });

                var numbers = new TNumbers();
                numbers.a = 1;
                numbers.b = 2;
                numbers.c = 3;

                result = lib.interface.mulStructMembers(numbers.ref());
            }

            assert.equal(result, 1 * 2 * 3);
        }

        var testMulStructMembersAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(noname) {
            var result, ptr;
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            assert(_.isFunction(lib.interface.mulStructMembers));

                            result = void 0;

                            if (noname) {
                                _context4.next = 11;
                                break;
                            }

                            assert(_.isFunction(lib.interface.TNumbers));
                            assert.strictEqual(ref.derefType(lib.functions.mulStructMembers.args[0].type), lib.structs.TNumbers.type);
                            ptr = lib.interface.TNumbers({
                                a: 1,
                                b: 2,
                                c: 3
                            });
                            _context4.next = 8;
                            return lib.interface.mulStructMembers(ptr);

                        case 8:
                            result = _context4.sent;
                            _context4.next = 14;
                            break;

                        case 11:
                            _context4.next = 13;
                            return lib.interface.mulStructMembers({
                                a: 1,
                                b: 2,
                                c: 3
                            });

                        case 13:
                            result = _context4.sent;

                        case 14:

                            assert.equal(result, 1 * 2 * 3);

                        case 15:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, this);
        }));
    });

    describe('Union', function () {
        it('could be created by plain object definition', function () {
            var result = lib.union({
                TUnion: {
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                }
            });

            assert.equal(result, lib);
            testUnionInterface();
        });

        it('could be created from UnionType', function () {
            var TUnion = new UnionType({
                a: 'short',
                b: 'int64',
                c: ref.types.long
            });
            var result = lib.union({ TUnion: TUnion });

            assert.equal(result, lib);
            testUnionInterface();
        });

        it('should supports C union like syntax', function () {
            var result = lib.union('union TUnion { short a; int64 b; long c; }');

            assert.equal(result, lib);
            testUnionInterface();
        });

        describe('sync', function () {
            it('should get referenced by string syntax', function () {
                lib.union({
                    TUnion: {
                        a: 'short',
                        b: 'int64',
                        c: ref.types.long
                    }
                }).function('int64 getAFromUnion(TUnion* union)').function('int64 getBFromUnion(TUnion* union)').function('int64 getCFromUnion(TUnion* union)');

                testAccessUnionMembersSync();
            });

            it('should get referenced by node-ffi-like syntax', function () {
                var TUnion = new UnionType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });
                lib.function({ getAFromUnion: ['int64', [ref.refType(TUnion)]] }).function({ getBFromUnion: ['int64', [ref.refType(TUnion)]] }).function({ getCFromUnion: ['int64', [ref.refType(TUnion)]] });

                testAccessUnionMembersSync(true);
            });
        });

        describe('async', function () {
            it('should get referenced by string syntax', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                    while (1) {
                        switch (_context5.prev = _context5.next) {
                            case 0:
                                lib.union({
                                    TUnion: {
                                        a: 'short',
                                        b: 'int64',
                                        c: ref.types.long
                                    }
                                }).asyncFunction('int64 getAFromUnion(TUnion* union)').asyncFunction('int64 getBFromUnion(TUnion* union)').asyncFunction('int64 getCFromUnion(TUnion* union)');

                                _context5.next = 3;
                                return testAccessUnionMembersAsync();

                            case 3:
                            case 'end':
                                return _context5.stop();
                        }
                    }
                }, _callee5, this);
            })));

            it('should get referenced by node-ffi-like syntax', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
                var TUnion;
                return regeneratorRuntime.wrap(function _callee6$(_context6) {
                    while (1) {
                        switch (_context6.prev = _context6.next) {
                            case 0:
                                TUnion = new UnionType({
                                    a: 'short',
                                    b: 'int64',
                                    c: ref.types.long
                                });

                                lib.asyncFunction({ getAFromUnion: ['int64', [ref.refType(TUnion)]] }).asyncFunction({ getBFromUnion: ['int64', [ref.refType(TUnion)]] }).asyncFunction({ getCFromUnion: ['int64', [ref.refType(TUnion)]] });

                                _context6.next = 4;
                                return testAccessUnionMembersAsync(true);

                            case 4:
                            case 'end':
                                return _context6.stop();
                        }
                    }
                }, _callee6, this);
            })));
        });

        function testUnionInterface() {
            assert(_.isObject(lib.unions.TUnion));
            assert(_.isFunction(lib.interface.TUnion));
            assert(_.isFunction(lib.unions.TUnion.type));
            assert.equal(lib.interface.TUnion.union, lib.unions.TUnion);
            assert.equal(lib.interface.TUnion.type, lib.unions.TUnion.type);

            var ptr1 = lib.interface.TUnion({
                a: 1
            });
            assert(ptr1 instanceof Buffer);
            assert.equal(ptr1.type, lib.unions.TUnion.type);
            assert.equal(ptr1.union, lib.unions.TUnion);

            var union = lib.unions.TUnion.type(ptr1);
            assert.equal(union.a, 1);
        }

        function testAccessUnionMembersSync(noname) {
            assert(_.isFunction(lib.interface.getAFromUnion));
            assert(_.isFunction(lib.interface.getBFromUnion));
            assert(_.isFunction(lib.interface.getCFromUnion));

            if (!noname) {
                assert(_.isFunction(lib.interface.TUnion));
                assert.strictEqual(ref.derefType(lib.functions.getAFromUnion.args[0].type), lib.unions.TUnion.type);
                assert.strictEqual(ref.derefType(lib.functions.getBFromUnion.args[0].type), lib.unions.TUnion.type);
                assert.strictEqual(ref.derefType(lib.functions.getCFromUnion.args[0].type), lib.unions.TUnion.type);

                var ptr = lib.interface.TUnion({ a: 1 });
                var result = lib.interface.getAFromUnion(ptr);
                assert.equal(result, 1);

                var union = lib.unions.TUnion.type({ b: 2 });
                result = lib.interface.getBFromUnion(union.ref());
                assert.equal(result, 2);
            } else {
                var _result = lib.interface.getCFromUnion({ c: 3 });
                assert.equal(_result, 3);
            }
        }

        var testAccessUnionMembersAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(noname) {
            var ptr, result, union, _result2;

            return regeneratorRuntime.wrap(function _callee7$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            assert(_.isFunction(lib.interface.getAFromUnion));
                            assert(_.isFunction(lib.interface.getBFromUnion));
                            assert(_.isFunction(lib.interface.getCFromUnion));

                            if (noname) {
                                _context7.next = 20;
                                break;
                            }

                            assert(_.isFunction(lib.interface.TUnion));
                            assert.strictEqual(ref.derefType(lib.functions.getAFromUnion.args[0].type), lib.unions.TUnion.type);
                            assert.strictEqual(ref.derefType(lib.functions.getBFromUnion.args[0].type), lib.unions.TUnion.type);
                            assert.strictEqual(ref.derefType(lib.functions.getCFromUnion.args[0].type), lib.unions.TUnion.type);

                            ptr = lib.interface.TUnion({ a: 1 });
                            _context7.next = 11;
                            return lib.interface.getAFromUnion(ptr);

                        case 11:
                            result = _context7.sent;

                            assert.equal(result, 1);

                            union = lib.unions.TUnion.type({ b: 2 });
                            _context7.next = 16;
                            return lib.interface.getBFromUnion(union.ref());

                        case 16:
                            result = _context7.sent;

                            assert.equal(result, 2);
                            _context7.next = 24;
                            break;

                        case 20:
                            _context7.next = 22;
                            return lib.interface.getCFromUnion({ c: 3 });

                        case 22:
                            _result2 = _context7.sent;

                            assert.equal(_result2, 3);

                        case 24:
                        case 'end':
                            return _context7.stop();
                    }
                }
            }, _callee7, this);
        }));
    });

    describe('Array', function () {
        it('should throw for not supported indexing', function () {
            var IntArray = new ArrayType('int');
            var arr = new IntArray([1, 2, 3]);
            assert.throws(function () {
                return arr[0];
            });
            assert.throws(function () {
                return arr[1];
            });
            assert.throws(function () {
                return arr[2];
            });
            assert.throws(function () {
                return arr[3];
            });
            assert.throws(function () {
                return arr[4];
            });
            assert.throws(function () {
                return arr[0] = 0;
            });
            assert.throws(function () {
                return arr[1] = 0;
            });
            assert.throws(function () {
                return arr[2] = 0;
            });
            assert.throws(function () {
                return arr[3] = 0;
            });
            assert.throws(function () {
                return arr[4] = 0;
            });
        });

        describe('fixed length', function () {
            it('could be created by plain object definition', function () {
                var result = lib.array({ TLongArray: 'long' }).struct({
                    TRecWithArray: {
                        values: 'TLongArray[5]',
                        index: 'uint'
                    }
                });

                assert.equal(result, lib);
                testArrayInterface(true);
            });

            it('could be created from ArrayType', function () {
                var TLongArray = new ArrayType(ref.types.long);
                var TRecWithArray = new StructType({
                    values: new ArrayType(ref.types.long, 5),
                    index: 'uint'
                });
                var result = lib.array({ TLongArray: TLongArray }).struct({ TRecWithArray: TRecWithArray });

                assert.equal(result, lib);
                testArrayInterface(true);
            });

            describe('with C like syntax', function () {
                it('should work for a simple declaration (https://github.com/cmake-js/fastcall/issues/15)', function () {
                    var result = lib.array('int[4] IntArray4');

                    assert(_.isFunction(lib.arrays.IntArray4.type));
                    assert.equal(lib.arrays.IntArray4.type.fixedLength, 4);
                });

                it('should support length definition in actual use', function () {
                    var result = lib.array('long[] TLongArray').struct('struct TRecWithArray { TLongArray[5] values; uint index; }');

                    assert.equal(result, lib);
                    testArrayInterface(true);
                });
            });
        });

        describe('free length', function () {
            describe('with square brackets', function () {
                it('could be created by plain object definition', function () {
                    var result = lib.array({ TLongArray: 'long' }).struct({
                        TRecWithArray: {
                            values: 'TLongArray[]',
                            index: 'uint'
                        }
                    });

                    assert.equal(result, lib);
                    testArrayInterface();
                });

                it('should supports C union like syntax', function () {
                    var result = lib.array('long[] TLongArray').struct('struct TRecWithArray { TLongArray[] values; uint index; }');

                    assert.equal(result, lib);
                    testArrayInterface();
                });
            });

            describe('without square brackets', function () {
                it('could be created by plain object definition', function () {
                    var result = lib.array({ TLongArray: 'long' }).struct({
                        TRecWithArray: {
                            values: 'TLongArray',
                            index: 'uint'
                        }
                    });

                    assert.equal(result, lib);
                    testArrayInterface();
                });

                it('could be created from ArrayType', function () {
                    var TLongArray = new ArrayType(ref.types.long);
                    var TRecWithArray = new StructType({
                        values: TLongArray,
                        index: 'uint'
                    });
                    var result = lib.array({ TLongArray: TLongArray }).struct({ TRecWithArray: TRecWithArray });

                    assert.equal(result, lib);
                    testArrayInterface();
                });

                it('should supports C union like syntax', function () {
                    var result = lib.array('long[] TLongArray').struct('struct TRecWithArray { TLongArray values; uint index; }');

                    assert.equal(result, lib);
                    testArrayInterface();
                });
            });
        });

        describe('sync', function () {
            it('should get referenced by string syntax', function () {
                lib.array('long[] TLongArray').struct('struct TRecWithArray { TLongArray[5] values; uint index; }').array('TRecWithArray[] TRecWithArrays').function('void makeRecWithArrays(TRecWithArrays* records, long* size)').function('void incRecWithArrays(TRecWithArray* records, long size)').function('void freeRecWithArrays(TRecWithArrays records)');

                testArrayFuncsSync();
            });

            it('should get referenced by node-ffi-like syntax', function () {
                var TRecWithArray = new StructType({
                    values: new ArrayType(ref.types.long, 5),
                    index: 'uint'
                });
                var TRecWithArrays = new ArrayType(TRecWithArray);

                lib.function({ makeRecWithArrays: ['void', [ref.refType(TRecWithArrays), ref.refType('long')]] }).function({ incRecWithArrays: ['void', [TRecWithArrays, 'long']] }).function({ freeRecWithArrays: ['void', [TRecWithArrays]] });

                testArrayFuncsSync(TRecWithArray, TRecWithArrays);
            });
        });

        describe('async', function () {
            it('should get referenced by string syntax', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
                return regeneratorRuntime.wrap(function _callee8$(_context8) {
                    while (1) {
                        switch (_context8.prev = _context8.next) {
                            case 0:
                                lib.array('long[] TLongArray').struct('struct TRecWithArray { TLongArray[5] values; uint index; }').array('TRecWithArray[] TRecWithArrays').function('void makeRecWithArrays(TRecWithArrays* records, long* size)').function('void incRecWithArrays(TRecWithArrays records, long size)').function('void freeRecWithArrays(TRecWithArray* records)');

                                _context8.next = 3;
                                return testArrayFuncsAsync();

                            case 3:
                            case 'end':
                                return _context8.stop();
                        }
                    }
                }, _callee8, this);
            })));

            it('should get referenced by node-ffi-like syntax', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee9() {
                var TRecWithArray, TRecWithArrays;
                return regeneratorRuntime.wrap(function _callee9$(_context9) {
                    while (1) {
                        switch (_context9.prev = _context9.next) {
                            case 0:
                                TRecWithArray = new StructType({
                                    values: new ArrayType(ref.types.long, 5),
                                    index: 'uint'
                                });
                                TRecWithArrays = new ArrayType(TRecWithArray);


                                lib.function({ makeRecWithArrays: ['void', [ref.refType(TRecWithArrays), ref.refType('long')]] }).function({ incRecWithArrays: ['void', [TRecWithArrays, 'long']] }).function({ freeRecWithArrays: ['void', [ref.refType(TRecWithArray)]] });

                                _context9.next = 5;
                                return testArrayFuncsAsync(TRecWithArray, TRecWithArrays);

                            case 5:
                            case 'end':
                                return _context9.stop();
                        }
                    }
                }, _callee9, this);
            })));
        });

        function testArrayInterface(fixed) {
            assert(_.isObject(lib.structs.TRecWithArray));
            assert(_.isFunction(lib.interface.TRecWithArray));
            assert(_.isFunction(lib.structs.TRecWithArray.type));
            assert.equal(lib.interface.TRecWithArray.struct, lib.structs.TRecWithArray);
            assert.equal(lib.interface.TRecWithArray.type, lib.structs.TRecWithArray.type);

            assert(_.isObject(lib.arrays.TLongArray));
            assert(_.isFunction(lib.interface.TLongArray));
            assert(_.isFunction(lib.arrays.TLongArray.type));
            assert.equal(lib.interface.TLongArray.array, lib.arrays.TLongArray);
            assert.equal(lib.interface.TLongArray.type, lib.arrays.TLongArray.type);

            var ptr1 = lib.interface.TRecWithArray({
                values: [0, 1, 2, 3, 4],
                index: 42
            });
            if (fixed) {
                assert(ptr1.length >= 24);
            } else {
                assert(ptr1.length >= 16);
            }
            assert(ptr1 instanceof Buffer);
            assert.equal(ptr1.type, lib.structs.TRecWithArray.type);
            assert.equal(ptr1.struct, lib.structs.TRecWithArray);

            var record = lib.structs.TRecWithArray.type(ptr1);
            assert.equal(record.index, 42);
            if (!fixed) {
                assert.equal(record.values.length, 0);
                record.values.length = 5;
            }
            assert.equal(record.values.length, 5);
            assert.equal(record.values.get(0), 0);
            assert.equal(record.values.get(1), 1);
            assert.equal(record.values.get(2), 2);
            assert.equal(record.values.get(3), 3);
            assert.equal(record.values.get(4), 4);
        }

        function testArrayFuncsSync(TRecWithArray, TRecWithArrays) {
            TRecWithArray = TRecWithArray || lib.structs.TRecWithArray.type;
            assert(_.isFunction(TRecWithArray));
            TRecWithArrays = TRecWithArrays || lib.arrays.TRecWithArrays.type;
            assert(_.isFunction(TRecWithArrays));
            assert(_.isFunction(lib.interface.makeRecWithArrays));
            assert(_.isFunction(lib.interface.incRecWithArrays));
            assert(_.isFunction(lib.interface.freeRecWithArrays));

            var resultRef = ref.alloc(TRecWithArrays);
            var sizeRef = ref.alloc('long');

            lib.interface.makeRecWithArrays(resultRef, sizeRef);
            var size = sizeRef.deref();
            assert.equal(size, 5);
            var result = resultRef.deref();
            assert.equal(result.length, 0);
            result.length = 5;
            assert.equal(result.length, 5);
            for (var i = 0; i < size; i++) {
                var rec = result.get(i);
                assert.equal(rec.index, i);
                for (var j = 0; j < 5; j++) {
                    assert.equal(rec.values.get(j), j);
                }
            }

            lib.interface.freeRecWithArrays(result);
        }

        var testArrayFuncsAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(TRecWithArray, TRecWithArrays) {
            var records, i;
            return regeneratorRuntime.wrap(function _callee10$(_context10) {
                while (1) {
                    switch (_context10.prev = _context10.next) {
                        case 0:
                            TRecWithArray = TRecWithArray || lib.structs.TRecWithArray.type;
                            assert(_.isFunction(TRecWithArray));
                            TRecWithArrays = TRecWithArrays || lib.arrays.TRecWithArrays.type;
                            assert(_.isFunction(TRecWithArrays));
                            assert(_.isFunction(lib.interface.makeRecWithArrays));
                            assert(_.isFunction(lib.interface.incRecWithArrays));
                            assert(_.isFunction(lib.interface.freeRecWithArrays));

                            records = new TRecWithArrays([{
                                index: 4,
                                values: [3, 4, 5, 6, 7]
                            }, new TRecWithArray({
                                index: 5,
                                values: [-3, -4, -5, -6, -7]
                            })]);
                            _context10.next = 10;
                            return lib.interface.incRecWithArrays.async(records, 2);

                        case 10:

                            assert.equal(records.get(0).index, 5);
                            assert.equal(records.get(1).index, 6);

                            for (i = 0; i < 5; i++) {
                                assert.equal(records.get(0).values.get(i), i + 4);
                                assert.equal(records.get(1).values.get(i), -2 - i);
                            }

                        case 13:
                        case 'end':
                            return _context10.stop();
                    }
                }
            }, _callee10, this);
        }));
    });

    describe('complex ref-types', function () {
        describe('tagged union', function () {
            beforeEach(function () {
                lib.union('union TUnion { short a; int64 b; long c; }').struct('struct TTaggedUnion { char tag; TUnion data; }').function('int64 getValueFromTaggedUnion(TTaggedUnion* u)');

                assert(_.isFunction(lib.interface.TUnion));
                assert(_.isFunction(lib.interface.TTaggedUnion));
                assert(_.isFunction(lib.interface.getValueFromTaggedUnion));
                assert(lib.unions.TUnion);
                assert(lib.structs.TTaggedUnion);
                assert(lib.functions.getValueFromTaggedUnion);
            });

            it('works synchronously', function () {
                var struct = lib.structs.TTaggedUnion.type({
                    tag: 'b'.charCodeAt(0),
                    data: { b: 42 }
                });

                assert(_.isObject(struct));
                assert.equal(struct.tag, 'b'.charCodeAt(0));
                assert.equal(struct.data.b, 42);

                var result = lib.interface.getValueFromTaggedUnion(struct.ref());
                assert.equal(result, 42);

                struct = lib.structs.TTaggedUnion.type({
                    tag: 'b'.charCodeAt(0),
                    data: lib.interface.TUnion.type({ b: 42 })
                });

                assert(_.isObject(struct));
                assert.equal(struct.tag, 'b'.charCodeAt(0));
                assert.equal(struct.data.b, 42);

                result = lib.interface.getValueFromTaggedUnion(struct.ref());
                assert.equal(result, 42);
            });

            it('works asynchronously', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
                var result;
                return regeneratorRuntime.wrap(function _callee11$(_context11) {
                    while (1) {
                        switch (_context11.prev = _context11.next) {
                            case 0:
                                _context11.next = 2;
                                return lib.interface.getValueFromTaggedUnion.async({
                                    tag: 'a'.charCodeAt(0),
                                    data: { a: 5 }
                                });

                            case 2:
                                result = _context11.sent;

                                assert.equal(result, 5);

                            case 4:
                            case 'end':
                                return _context11.stop();
                        }
                    }
                }, _callee11, this);
            })));
        });
    });
});
//# sourceMappingURL=refTypes.js.map