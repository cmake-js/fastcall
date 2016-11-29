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
const ffi = require('../../lib').ffi;
const ref = ffi.ref;
const ArrayType = ffi.ArrayType;
const UnionType = ffi.UnionType;
const StructType = ffi.StructType;
const Library = ffi.Library;
const Callback = ffi.Callback;
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const Promise = require('bluebird');
const async = Promise.coroutine;

describe('ffi compatibility', function () {
    let libPath = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

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
            const lib = ffi.Library(libPath, {
                mul: [ 'int', [ 'int', 'int' ]],
                getString: [ 'char*', [] ]
            });

            try {
                assert(_.isFunction(lib.mul));
                assert.equal(lib.mul(21, 2), 42);
                assert.equal(ref.readCString(lib.getString()), 'world');
            }
            finally {
                lib.release();
            }
        });

        describe('async', function () {
            it('supported explicitly', function (done) {
                const lib = ffi.Library(libPath, {
                    mul: [ 'int', [ 'int', 'int' ]]
                });

                try {
                    assert(_.isFunction(lib.mul));
                    assert(_.isFunction(lib.mul.async));
                    assert(_.isFunction(lib.mul.asyncPromise));
                    lib.mul.async(21, 2, (err, res) => {
                        setImmediate(() => lib.release());
                        if (err) {
                            done(err);
                        }
                        try {
                            assert.equal(res, 42);
                            done();
                        }
                        catch (err) {
                            done(err);
                        }
                    });
                }
                catch (err) {
                    lib.release();
                    done(err);
                }
            });

            it('supported in options', function (done) {
                const lib = ffi.Library(
                    libPath, 
                    {
                        mul: [ 'int', [ 'int', 'int' ]]
                    },
                    {
                        async: true
                    });

                try {
                    assert(_.isFunction(lib.mul));
                    assert(_.isUndefined(lib.mul.async));
                    assert(_.isFunction(lib.mul.asyncPromise));
                    lib.mul(21, 2, (err, res) => {
                        setImmediate(() => lib.release());
                        if (err) {
                            done(err);
                        }
                        try {
                            assert.equal(res, 42);
                            done();
                        }
                        catch (err) {
                            done(err);
                        }
                    });
                }
                catch (err) {
                    lib.release();
                    done(err);
                }
            });
        });

        it('supports promises', async(function* () {
            const lib = ffi.Library(libPath, {
                mul: [ 'int', [ 'int', 'int' ]]
            });

            try {
                assert(_.isFunction(lib.mul));
                assert(_.isFunction(lib.mul.async));
                assert(_.isFunction(lib.mul.asyncPromise));
                assert.equal(yield lib.mul.asyncPromise(21, 2), 42);
            }
            finally {
                lib.release();
            }
        }));
    });

    describe('callback', function () {
        describe('sync', function () {
            it('supports ffi-style callbacks', function () {
                const lib = ffi.Library(libPath, {
                    makeInt: ['int', ['float', 'double', 'pointer'] ]
                });

                try {
                    let v = 0.1;
                    const cb = new Callback(
                        'int', [ref.types.float, 'double'],
                        function (float, double) {
                            return float + double + v; 
                        });
                    
                    assert(_.isFunction(lib.makeInt));
                    assert(_.isFunction(lib.makeInt.async));
                    assert(_.isFunction(lib.makeInt.asyncPromise));
                    assert.deepEqual(_.keys(lib._library.callbacks), []);
                    assert.equal(lib.makeInt(19.9, 2, cb), 42);
                    v += 0.1;
                    assert.equal(lib.makeInt(19.9, 2, cb), 44);
                    assert.deepEqual(_.keys(lib._library.callbacks), ['FFICallback0']);
                }
                finally {
                    lib.release();
                }
            });
        });

        describe('async', function () {
            it('supports ffi-style callbacks', function (done) {
                const lib = ffi.Library(libPath, {
                    makeInt: ['int', ['float', 'double', 'pointer'] ]
                });

                try {
                    const cb = new Callback(
                        'int', [ref.types.float, 'double'],
                        function (float, double) {
                            return float + double + 0.1; 
                        });

                    assert(_.isFunction(lib.makeInt));
                    assert(_.isFunction(lib.makeInt.async));
                    assert(_.isFunction(lib.makeInt.asyncPromise));
                    assert.deepEqual(_.keys(lib._library.callbacks), []);
                    lib.makeInt.async(19.9, 2, cb, (err, res) => {
                        setImmediate(() => lib.release());
                        if (err) {
                            done(err);
                        }
                        try {
                            assert.equal(res, 42);
                            assert.deepEqual(_.keys(lib._library.callbacks), ['FFICallback0']);
                            done();
                        }
                        catch (err) {
                            done(err);
                        }
                    });
                }
                catch (err) {
                    lib.release();
                    done(err);
                }
            });
        });
    });

    describe('array of structs', function () {
        it('is supported', function () {
            const TRecWithArray = new StructType({
                values: new ArrayType(ref.types.long, 5),
                index: 'uint',
            });
            const TRecWithArrays = new ArrayType(TRecWithArray);
            const lib = ffi.Library(libPath, {
                incRecWithArrays: [ 'void', [ TRecWithArrays, 'long' ]]
            });
            assert.deepEqual(_.keys(lib._library.structs), ['StructType0']);
            assert.deepEqual(_.keys(lib._library.arrays), []);
            
            try {
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

                lib.incRecWithArrays(records, 2);
                assert.deepEqual(_.keys(lib._library.structs), ['StructType0']);
                assert.deepEqual(_.keys(lib._library.arrays), []);

                assert.equal(records.get(0).index, 5);
                assert.equal(records.get(1).index, 6);

                for (let i = 0; i < 5; i++) {
                    assert.equal(records.get(0).values.get(i), i + 4);
                    assert.equal(records.get(1).values.get(i), -2 - i);
                }
            }
            finally {
                lib.release();
            }
        });
    });

    describe('tagged union', function () {
        it('is supported', function () {
            const TUnion = new UnionType({
                a: 'short',
                b: 'int64',
                c: 'long'
            });
            const TTaggedUnion = new StructType({
                tag: 'char',
                data: TUnion
            });
            const lib = ffi.Library(libPath, {
                getValueFromTaggedUnion: [ 'int64', [ ref.refType(TTaggedUnion) ]]
            });
            assert.deepEqual(_.keys(lib._library.unions), []);
            assert.deepEqual(_.keys(lib._library.structs), ['StructType0']);

            try {
                let struct = new TTaggedUnion({
                    tag: 'b'.charCodeAt(0),
                    data: { b: 42 }
                });

                assert(_.isObject(struct));
                assert.equal(struct.tag, 'b'.charCodeAt(0));
                assert.equal(struct.data.b, 42);

                let result = lib.getValueFromTaggedUnion(struct.ref());
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
            }
            finally {
                lib.release();
            }
        });
    });
});