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

describe.only('Ref Types', function () {
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
});