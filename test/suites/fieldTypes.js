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

describe('Field Types', function () {
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
        it('could be created from plain object definition', function () {
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

        describe('sync', function () {
            it('should work with string syntax', function () {
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

            it('should work with node-ffi-like syntax', function () {
                const TNumbers = new StructType({
                    a: 'short',
                    b: 'int64',
                    c: ref.types.long
                });
                lib.function(['int64', [ TNumbers ]]);

                testMulStructMembersSync();
            });
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

        function testMulStructMembersSync() {
            assert(_.isFunction(lib.interfce.mulStructMembers));
            assert.equal(lib.interfce.mulStructMembers.function.resultType, lib.structs.TNumbers.type);
            assert.equal(lib.interfce.mulStructMembers.function.resultType, lib.interface.TNumbers.type);

            const result = lib.interfce.mulStructMembers({
                a: 1,
                b: 2,
                c: 3
            });

            assert.equal(result, 1 * 2 * 3);
        }
    });
});