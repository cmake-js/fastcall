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
const fastcall = require('../../lib');
const Library = fastcall.Library;
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const ref = fastcall.ref;
const Promise = require('bluebird');
const async = Promise.coroutine;
const StructType = fastcall.StructType;
const UnionType = fastcall.UnionType;
const ArrayType = fastcall.ArrayType;

describe(`ref types`, function () {
    let libPath = null;
    let lib = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

    beforeEach(function () {
        lib = new Library(libPath);
    });

    afterEach(function () {
        lib.release();
    });

    describe('Struct', function () {
        it('could be created by plain object definition', function () {
            const result = lib.struct({
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
            const TNumbers = new StructType({
                a: 'short',
                b: 'int64',
                c: ref.types.long
            });
            const result = lib.struct({ TNumbers });

            assert.equal(result, lib);
            testStructInterface();
        });

        it('should supports C struct like syntax', function () {
            const result = lib.struct('struct TNumbers { short a; int64 b; long c; }');

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
                })
                .function('int64 mulStructMembers(TNumbers* numbers)');

                testMulStructMembersSync();
            });

            it('should get referenced by node-ffi-like syntax', function () {
                const TNumbers = new StructType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });
                lib.function({ mulStructMembers: ['int64', [ ref.refType(TNumbers) ]] });

                testMulStructMembersSync(true);
            });
        });

        describe('async', function () {
           it('should get referenced by string syntax', async(function* () {
                lib.struct({
                    TNumbers: {
                        a: 'short',
                        b: 'int64',
                        c: ref.types.long
                    }
                })
                .asyncFunction('int64 mulStructMembers(TNumbers* numbers)');

                yield testMulStructMembersAsync();
            }));

            it('should get referenced by node-ffi-like syntax', async(function* () {
                const TNumbers = new StructType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });
                lib.asyncFunction({ mulStructMembers: ['int64', [ ref.refType(TNumbers) ]] });

                yield testMulStructMembersAsync(true);
            }));
        });

        function testStructInterface() {
            assert(_.isObject(lib.structs.TNumbers));
            assert(_.isFunction(lib.interface.TNumbers));
            assert(_.isFunction(lib.structs.TNumbers.type));
            assert.equal(lib.interface.TNumbers.struct, lib.structs.TNumbers);
            assert.equal(lib.interface.TNumbers.type, lib.structs.TNumbers.type);

            const ptr1 = lib.interface.TNumbers({
                a: 1,
                b: 2,
                c: 3
            });
            assert(ptr1 instanceof Buffer);
            assert.equal(ptr1.type, lib.structs.TNumbers.type);
            assert.equal(ptr1.struct, lib.structs.TNumbers);

            const numbers = lib.structs.TNumbers.type(ptr1);
            assert.equal(numbers.a, 1);
            assert.equal(numbers.b, 2);
            assert.equal(numbers.c, 3);
        }

        function testMulStructMembersSync(noname) {
            assert(_.isFunction(lib.interface.mulStructMembers));

            let result;
            if (!noname) {
                assert(_.isFunction(lib.interface.TNumbers));
                assert.strictEqual(ref.derefType(lib.functions.mulStructMembers.args[0].type), lib.structs.TNumbers.type);
                const ptr = lib.interface.TNumbers({
                    a: 1,
                    b: 2,
                    c: 3
                });
                result = lib.interface.mulStructMembers(ptr);
            }
            else {
                const TNumbers = new StructType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });

                const numbers = new TNumbers();
                numbers.a = 1;
                numbers.b = 2;
                numbers.c = 3;

                result = lib.interface.mulStructMembers(numbers.ref());
            }

            assert.equal(result, 1 * 2 * 3);
        }

        var testMulStructMembersAsync = async(function* (noname) {
            assert(_.isFunction(lib.interface.mulStructMembers));

            let result;
            if (!noname) {
                assert(_.isFunction(lib.interface.TNumbers));
                assert.strictEqual(ref.derefType(lib.functions.mulStructMembers.args[0].type), lib.structs.TNumbers.type);
                const ptr = lib.interface.TNumbers({
                    a: 1,
                    b: 2,
                    c: 3
                });
                result = yield lib.interface.mulStructMembers(ptr);
            }
            else {
                result = yield lib.interface.mulStructMembers({
                    a: 1,
                    b: 2,
                    c: 3
                });
            }

            assert.equal(result, 1 * 2 * 3);
        });
    });

    describe('Union', function () {
        it('could be created by plain object definition', function () {
            const result = lib.union({
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
            const TUnion = new UnionType({
                a: 'short',
                b: 'int64',
                c: ref.types.long
            });
            const result = lib.union({ TUnion });

            assert.equal(result, lib);
            testUnionInterface();
        });

        it('should supports C union like syntax', function () {
            const result = lib.union('union TUnion { short a; int64 b; long c; }');

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
                })
                .function('int64 getAFromUnion(TUnion* union)')
                .function('int64 getBFromUnion(TUnion* union)')
                .function('int64 getCFromUnion(TUnion* union)');

                testAccessUnionMembersSync();
            });

            it('should get referenced by node-ffi-like syntax', function () {
                const TUnion = new UnionType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });
                lib.function({ getAFromUnion: ['int64', [ ref.refType(TUnion) ]] })
                .function({ getBFromUnion: ['int64', [ ref.refType(TUnion) ]] })
                .function({ getCFromUnion: ['int64', [ ref.refType(TUnion) ]] });

                testAccessUnionMembersSync(true);
            });
        });

        describe('async', function () {
           it('should get referenced by string syntax', async(function* () {
                lib.union({
                    TUnion: {
                        a: 'short',
                        b: 'int64',
                        c: ref.types.long
                    }
                })
                .asyncFunction('int64 getAFromUnion(TUnion* union)')
                .asyncFunction('int64 getBFromUnion(TUnion* union)')
                .asyncFunction('int64 getCFromUnion(TUnion* union)');

                yield testAccessUnionMembersAsync();
            }));

            it('should get referenced by node-ffi-like syntax', async(function* () {
                const TUnion = new UnionType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });
                lib.asyncFunction({ getAFromUnion: ['int64', [ ref.refType(TUnion) ]] })
                .asyncFunction({ getBFromUnion: ['int64', [ ref.refType(TUnion) ]] })
                .asyncFunction({ getCFromUnion: ['int64', [ ref.refType(TUnion) ]] });

                yield testAccessUnionMembersAsync(true);
            }));
        });

        function testUnionInterface() {
            assert(_.isObject(lib.unions.TUnion));
            assert(_.isFunction(lib.interface.TUnion));
            assert(_.isFunction(lib.unions.TUnion.type));
            assert.equal(lib.interface.TUnion.union, lib.unions.TUnion);
            assert.equal(lib.interface.TUnion.type, lib.unions.TUnion.type);

            const ptr1 = lib.interface.TUnion({
                a: 1
            });
            assert(ptr1 instanceof Buffer);
            assert.equal(ptr1.type, lib.unions.TUnion.type);
            assert.equal(ptr1.union, lib.unions.TUnion);

            const union = lib.unions.TUnion.type(ptr1);
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

                const ptr = lib.interface.TUnion({ a: 1 });
                let result = lib.interface.getAFromUnion(ptr);
                assert.equal(result, 1);

                const union = lib.unions.TUnion.type({ b: 2 });
                result = lib.interface.getBFromUnion(union.ref());
                assert.equal(result, 2);
            }
            else {
                const result = lib.interface.getCFromUnion({ c: 3 });
                assert.equal(result, 3);
            }
        }

        var testAccessUnionMembersAsync = async(function* (noname) {
            assert(_.isFunction(lib.interface.getAFromUnion));
            assert(_.isFunction(lib.interface.getBFromUnion));
            assert(_.isFunction(lib.interface.getCFromUnion));

            if (!noname) {
                assert(_.isFunction(lib.interface.TUnion));
                assert.strictEqual(ref.derefType(lib.functions.getAFromUnion.args[0].type), lib.unions.TUnion.type);
                assert.strictEqual(ref.derefType(lib.functions.getBFromUnion.args[0].type), lib.unions.TUnion.type);
                assert.strictEqual(ref.derefType(lib.functions.getCFromUnion.args[0].type), lib.unions.TUnion.type);

                const ptr = lib.interface.TUnion({ a: 1 });
                let result = yield lib.interface.getAFromUnion(ptr);
                assert.equal(result, 1);

                const union = lib.unions.TUnion.type({ b: 2 });
                result = yield lib.interface.getBFromUnion(union.ref());
                assert.equal(result, 2);
            }
            else {
                const result = yield lib.interface.getCFromUnion({ c: 3 });
                assert.equal(result, 3);
            }
        });
    });

    describe('Array', function () {
        describe('fixed length', function () {
            it('could be created by plain object definition', function () {
                const result = lib
                .array({ TLongArray: 'long' })
                .struct({
                    TRecWithArray: {
                        values: 'TLongArray[5]',
                        index: 'uint'
                    }
                });

                assert.equal(result, lib);
                testArrayInterface(true);
            });

            it('could be created from ArrayType', function () {
                const TLongArray = new ArrayType(ref.types.long);
                const TRecWithArray = new StructType({
                    values: new ArrayType(ref.types.long, 5),
                    index: 'uint',
                });
                const result = lib.array({ TLongArray }).struct({ TRecWithArray });

                assert.equal(result, lib);
                testArrayInterface(true);
            });

            it('should supports C union like syntax', function () {
                const result = lib
                .array('long[] TLongArray')
                .struct('struct TRecWithArray { TLongArray[5] values; uint index; }');

                assert.equal(result, lib);
                testArrayInterface(true);
            });
        });

        describe('free length', function () {
            it('could be created by plain object definition', function () {
                const result = lib
                .array({ TLongArray: 'long' })
                .struct({
                    TRecWithArray: {
                        values: 'TLongArray',
                        index: 'uint'
                    }
                });

                assert.equal(result, lib);
                testArrayInterface();
            });

            it('could be created from ArrayType', function () {
                const TLongArray = new ArrayType(ref.types.long);
                const TRecWithArray = new StructType({
                    values: TLongArray,
                    index: 'uint',
                });
                const result = lib.array({ TLongArray }).struct({ TRecWithArray });

                assert.equal(result, lib);
                testArrayInterface();
            });

            it('should supports C union like syntax', function () {
                const result = lib
                .array('long[] TLongArray')
                .struct('struct TRecWithArray { TLongArray values; uint index; }');

                assert.equal(result, lib);
                testArrayInterface();
            });
        });

        describe('sync', function () {
           it('should get referenced by string syntax', function () {
                lib
                .array('long[] TLongArray')
                .struct('struct TRecWithArray { TLongArray[5] values; uint index; }')
                .array('TRecWithArray[] TRecWithArrays')
                .function('void makeRecWithArrays(TRecWithArrays* records, long* size)')
                .function('void incRecWithArrays(TRecWithArray* records, long size)')
                .function('void freeRecWithArrays(TRecWithArray* records)');

                testArrayFuncsSync();
            });

            it('should get referenced by node-ffi-like syntax', function () {
                const TRecWithArray = new StructType({
                    values: new ArrayType(ref.types.long, 5),
                    index: 'uint',
                });
                const TRecWithArrays = new ArrayType(TRecWithArray);
                
                lib
                .function({ makeRecWithArrays: [ 'void', [ ref.refType(ref.refType(TRecWithArray)), ref.refType('long') ]] })
                .function({ incRecWithArrays: [ 'void', [ ref.refType(TRecWithArray), 'long' ]] })
                .function({ freeRecWithArrays: [ 'void', [ ref.refType(TRecWithArray) ]] });

                testArrayFuncsSync(TRecWithArray, TRecWithArrays);
            });
        });

        describe('async', function () {
           it('should get referenced by string syntax', async(function* () {
                lib
                .array('long[] TLongArray')
                .struct('struct TRecWithArray { TLongArray[5] values; uint index; }')
                .array('TRecWithArray[] TRecWithArrays')
                .function('void makeRecWithArrays(TRecWithArrays* records, long* size)')
                .function('void incRecWithArrays(TRecWithArray* records, long size)')
                .function('void freeRecWithArrays(TRecWithArray* records)');

                yield testArrayFuncsAsync();
            }));

            it('should get referenced by node-ffi-like syntax', async(function* () {
                const TRecWithArray = new StructType({
                    values: new ArrayType(ref.types.long, 5),
                    index: 'uint',
                });
                const TRecWithArrays = new ArrayType(TRecWithArray);
                
                lib
                .function({ makeRecWithArrays: [ 'void', [ ref.refType(ref.refType(TRecWithArray)), ref.refType('long') ]] })
                .function({ incRecWithArrays: [ 'void', [ ref.refType(TRecWithArray), 'long' ]] })
                .function({ freeRecWithArrays: [ 'void', [ ref.refType(TRecWithArray) ]] });

                yield testArrayFuncsAsync(TRecWithArray, TRecWithArrays);
            }));
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

            const ptr1 = lib.interface.TRecWithArray({
                values: [0, 1, 2, 3, 4],
                index: 42
            });
            if (fixed) {
                assert(ptr1.length >= 24);
            }
            else {
                assert(ptr1.length >= 16);
            }
            assert(ptr1 instanceof Buffer);
            assert.equal(ptr1.type, lib.structs.TRecWithArray.type);
            assert.equal(ptr1.struct, lib.structs.TRecWithArray);

            const record = lib.structs.TRecWithArray.type(ptr1);
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
            assert(_.isFunction(lib.interface.makeRecWithArrays))
            assert(_.isFunction(lib.interface.incRecWithArrays));
            assert(_.isFunction(lib.interface.freeRecWithArrays));
            
            const resultRef = ref.alloc(TRecWithArrays);
            const sizeRef = ref.alloc('long');
            
            lib.interface.makeRecWithArrays(resultRef, sizeRef);
            const size = sizeRef.deref();
            assert.equal(size, 5);
            const result = resultRef.deref();
            assert.equal(result.length, 0);
            result.length = 5;
            assert.equal(result.length, 5);
            for (let i = 0; i < size; i++) {
                const rec = result.get(i);
                assert.equal(rec.index, i);
                for (let j = 0; j < 5; j++) {
                    assert.equal(rec.values.get(j), j);
                }
            }

            lib.interface.freeRecWithArrays(result);
        }

        var testArrayFuncsAsync = async(function* (TRecWithArray, TRecWithArrays) {
            TRecWithArray = TRecWithArray || lib.structs.TRecWithArray.type;
            assert(_.isFunction(TRecWithArray));
            TRecWithArrays = TRecWithArrays || lib.arrays.TRecWithArrays.type;
            assert(_.isFunction(TRecWithArrays));
            assert(_.isFunction(lib.interface.makeRecWithArrays))
            assert(_.isFunction(lib.interface.incRecWithArrays));
            assert(_.isFunction(lib.interface.freeRecWithArrays));

            const records = new TRecWithArrays([
                {
                    index: 4,
                    values: [3, 4, 5, 6, 7]
                },
                new TRecWithArray({
                    index: 5,
                    values: [-3, -4, -5, -6, -7]
                })
            ]);

            yield lib.interface.incRecWithArrays.async(records, 2);

            assert.equal(records.get(0).index, 5);
            assert.equal(records.get(1).index, 6);

            for (let i = 0; i < 5; i++) {
                assert.equal(records.get(0).values.get(i), i + 4);
                assert.equal(records.get(1).values.get(i), -2 - i);
            }
        });
    });

    describe('complex ref-types', function () {
        describe('tagged union', function () {
            beforeEach(function () {
                lib.union('union TUnion { short a; int64 b; long c; }')
                .struct('struct TTaggedUnion { char tag; TUnion data; }')
                .function('int64 getValueFromTaggedUnion(TTaggedUnion* u)');

                assert(_.isFunction(lib.interface.TUnion));
                assert(_.isFunction(lib.interface.TTaggedUnion));
                assert(_.isFunction(lib.interface.getValueFromTaggedUnion));
                assert(lib.unions.TUnion);
                assert(lib.structs.TTaggedUnion);
                assert(lib.functions.getValueFromTaggedUnion);
            });

            it('works synchronously', function () {
                let struct = lib.structs.TTaggedUnion.type({
                    tag: 'b'.charCodeAt(0),
                    data: { b: 42 }
                });

                assert(_.isObject(struct));
                assert.equal(struct.tag, 'b'.charCodeAt(0));
                assert.equal(struct.data.b, 42);

                let result = lib.interface.getValueFromTaggedUnion(struct.ref());
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

            it('works asynchronously', async(function* () {
                const result = yield lib.interface.getValueFromTaggedUnion.async({
                    tag: 'a'.charCodeAt(0),
                    data: { a: 5 }
                });
                assert.equal(result, 5);
            }));
        });
    });
});