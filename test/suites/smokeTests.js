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

describe('Library', function () {
    let libPath = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

    describe('initialize', function () {
        describe('without options', function () {
            it('should init in sync mode as default', function () {
                const lib = new Library(libPath);
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                }
                finally {
                    lib.release();
                }
            });
        });

        describe('with options', function () {
            it('should init in sync mode explicitly', function () {
                const lib = new Library(libPath, { defaultCallMode: Library.callMode.sync });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                }
                finally {
                    lib.release();
                }
            });

            it('should init in async mode explicitly', function () {
                const lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.async);
                }
                finally {
                    lib.release();
                }
            });

            it('should throw when mode is unknown', function () {
                assert.throws(() => {
                    const lib = new Library(libPath, { defaultCallMode: 42 });
                });
            });
        });
    });

    describe('sync call mode (smoke test)', function () {
        let lib = null;

        beforeEach(function () {
            lib = new Library(libPath);
        });

        afterEach(function () {
            lib.release();
            lib = null;
        });

        describe('node-ffi style declaration', function () {
            it('should invoke "mul" with "declare"', function () {
                lib.function({ mul: ['int', [ref.types.int, 'int']] });
                testMulSync('int mul(int arg0, int arg1)');
            });

            it('should invoke "mul" with "declareSync"', function () {
                lib.syncFunction({ mul: ['int', [ref.types.int, 'int']] });
                testMulSync('int mul(int arg0, int arg1)');
            });

            it("should send Node.js Buffer's memory content to native code", function () {
                lib.function({ readLongPtr: ['long', [ref.refType('long'), 'uint']] });
                testReadLongPtrSync('long readLongPtr(long* arg0, uint arg1)');
            });

            it("should allow to write Node.js's string content in native code", function () {
                lib.function({ writeString: ['void', ['char*']] });
                testWriteStringSync('void writeString(char* arg0)');
            });

            it("should pass null in place of pointers", function () {
                lib.function({ writeString: ['void', ['char*']] });
                testPassNullSync('void writeString(char* arg0)');
            });

            it("should fail on non pointer argument in place of pointer", function () {
                lib.function({ writeString: ['void', ['char*']] });
                testPassNonPointerSync('void writeString(char* arg0)');
            });

            it('should read natvie memory', function () {
                lib.function({ getString: ['char*', []] });
                testGetStringSync('char* getString()');
            });

            it('should handle out arguments', function () {
                lib.function({ getNumbers: ['void', ['double**', ref.refType('size_t')]] });
                testGetNumbersSync('void getNumbers(double** arg0, size_t* arg1)');
            });

            it('should support callbacks', function () {
                lib
                    .callback({ TMakeIntFunc: ['int', [ref.types.float, 'double']] })
                    .function({ makeInt: ['int', ['float', 'double', 'TMakeIntFunc']] });

                testMakeIntSync(
                    'int TMakeIntFunc(float arg0, double arg1)',
                    'int makeInt(float arg0, double arg1, TMakeIntFunc arg2)');
            });
        });

        describe('string declaration', function () {
            it('should invoke "mul" with "function"', function () {
                // Argument name is optional:
                lib.function('int mul(int value, int)');
                testMulSync('int mul(int value, int arg1)');
            });

            it('should invoke "mul" with "syncFunction"', function () {
                // Argument name is optional:
                lib.syncFunction('int mul(int, int by)');
                testMulSync('int mul(int arg0, int by)');
            });

            it("should send Node.js Buffer's memory content to native code", function () {
                lib.function('long readLongPtr(long *ptr, uint offset)');
                testReadLongPtrSync('long readLongPtr(long* ptr, uint offset)');
            });

            it("should allow to write Node.js's string content in native code", function () {
                lib.function('void writeString(char* )');
                testWriteStringSync('void writeString(char* arg0)');
            });

            it("should pass null in place of pointers", function () {
                lib.function('void writeString(char*ch)');
                testPassNullSync('void writeString(char* ch)');
            });

            it("should fail on non pointer argument in place of pointer", function () {
                lib.function('void writeString(char * ch )');
                testPassNonPointerSync('void writeString(char* ch)');
            });

            it('should read natvie memory', function () {
                lib.function('char *getString()');
                testGetStringSync('char* getString()');
            });

            it('should handle out arguments', function () {
                lib.function('  void   getNumbers ( double *  * nums , size_t*count) ');
                testGetNumbersSync('void getNumbers(double** nums, size_t* count)');
            });

            it('should support callbacks', function () {
                lib
                    .callback('int TMakeIntFunc(float fv, double)')
                    .function('int makeInt(float , double dv, TMakeIntFunc func)');

                testMakeIntSync(
                    'int TMakeIntFunc(float fv, double arg1)',
                    'int makeInt(float arg0, double dv, TMakeIntFunc func)');
            });
        });

        function testMulSync(declaration) {
            assert(lib.functions);
            assert(lib.functions.mul);
            assert(lib.interface);
            assert(_.isFunction(lib.interface.mul));
            const mul = lib.interface.mul;

            // Verify metadata:
            assert(mul.function);
            assert.equal(mul.function.toString(), declaration);
            assert.equal(mul.function.name, 'mul');
            assert.equal(mul.function.resultType.name, 'int');
            assert.equal(mul.function.args.length, 2);
            assert(_.isString(mul.function.args[0].name));
            assert.equal(mul.function.args[0].type.name, 'int');
            assert(_.isString(mul.function.args[1].name));
            assert.equal(mul.function.args[1].type.name, 'int');

            // Call!
            assert.equal(mul(2, 2), 4);
            assert.equal(mul(10, 2), 20);
            assert.equal(mul(10, "3"), 30);
            assert.equal(mul(10.1, 2.1), 20);
            assert.equal(mul(mul(4, 4), 2), 32);

            // Zero is the default:
            assert.equal(mul(10), 0);
            assert.equal(mul(), 0);
            assert.equal(mul("a", "b"), 0);
        }

        function testReadLongPtrSync(declaration) {
            const readLongPtr = lib.interface.readLongPtr;
            assert(_.isFunction(readLongPtr));
            assert(readLongPtr.function);
            assert.equal(readLongPtr.function.toString(), declaration);
            const long = ref.types.long;
            const data = new Buffer(long.size * 2);
            long.set(data, 0, 1);
            long.set(data, long.size, 42);
            assert.equal(readLongPtr(data, 0), 1);
            assert.equal(readLongPtr(data, 1), 42);
        }

        function testWriteStringSync(declaration) {
            const writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            const string = ref.allocCString('          ');
            writeString(string);
            assert.equal(ref.readCString(string), 'hello');
        }

        function testPassNullSync(declaration) {
            const writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            // should not crash:
            writeString(null);
            writeString(ref.NULL);
        }

        function testPassNonPointerSync(declaration) {
            const writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            assert.throws(() => {
                writeString(42);
            });
            assert.throws(() => {
                writeString();
            });
        }

        function testGetStringSync(declaration) {
            const getString = lib.interface.getString;
            assert(_.isFunction(getString));
            assert(getString.function);
            assert.equal(getString.function.toString(), declaration);
            const string = getString();
            assert(_.isBuffer(string));
            assert(_.isObject(string.type));
            assert.equal(string.type.name, 'char');
            assert.equal(string.type.indirection, 1);
            assert.equal(string.length, 0);
            assert.equal(ref.readCString(string), 'world');
        }

        // void getNumbers(double** nums, size_t* size)
        function testGetNumbersSync(declaration) {
            const getNumbers = lib.interface.getNumbers;
            assert(_.isFunction(getNumbers));
            assert.equal(getNumbers.function.toString(), declaration);

            const double = ref.types.double;
            const doublePtrType = ref.refType(double);
            const doublePtrPtr = ref.alloc(doublePtrType);
            const sizeTPtr = ref.alloc('size_t');
            getNumbers(doublePtrPtr, sizeTPtr);

            const size = ref.deref(sizeTPtr);
            assert.equal(size, 3);
            let doublePtr = ref.deref(doublePtrPtr);
            assert(_.isBuffer(doublePtr));
            const first = ref.deref(doublePtr);
            assert(_.isNumber(first));
            assert.equal(first, 1.1);
            doublePtr = ref.reinterpret(doublePtr, size * double.size);
            assert.equal(double.get(doublePtr, 1 * double.size), 2.2);
            assert.equal(double.get(doublePtr, 2 * double.size), 3.3);
        }

        function testMakeIntSync(callbackDecl, funcDecl) {
            const TMakeIntFunc = lib.interface.TMakeIntFunc;
            assert(_.isFunction(TMakeIntFunc));
            assert(TMakeIntFunc.callback);
            assert.equal(TMakeIntFunc.callback.toString(), callbackDecl);

            const makeInt = lib.interface.makeInt;
            assert(_.isFunction(makeInt));
            assert.equal(makeInt.function.toString(), funcDecl);

            let result = makeInt(1.1, 2.2, (fv, dv) => fv + dv);
            assert.equal(result, Math.floor((1.1 + 2.2) * 2));
        }
    });

    describe('async call mode (smoke test)', function () {
        let lib = null;

        beforeEach(function () {
            lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
        });

        afterEach(function () {
            lib.release();
            lib = null;
        });

        describe('node-ffi style declaration', function () {
            it('should invoke "mul" with "function"', function () {
                lib.function({ mul: ['int', [ref.types.int, 'int']] });
                return testMulAsync('int mul(int arg0, int arg1)');
            });

            it('should invoke "mul" with "asyncFunction"', function () {
                lib.asyncFunction({ mul: ['int', [ref.types.int, 'int']] });
                return testMulAsync('int mul(int arg0, int arg1)');
            });

            it("should send Node.js Buffer's memory content to native code", function () {
                lib.function({ readLongPtr: ['long', [ref.refType('long'), 'uint']] });
                return testReadLongPtrAsync('long readLongPtr(long* arg0, uint arg1)');
            });

            it("should allow to write Node.js's string content in native code", function () {
                lib.function({ writeString: ['void', ['char*']] });
                return testWriteStringAsync('void writeString(char* arg0)');
            });

            it("should pass null in place of pointers", function () {
                lib.function({ writeString: ['void', ['char*']] });
                return testPassNullAsync('void writeString(char* arg0)');
            });

            it("should fail on non pointer argument in place of pointer", function () {
                lib.function({ writeString: ['void', ['char*']] });
                return testPassNonPointerAsync('void writeString(char* arg0)');
            });

            it('should read natvie memory', function () {
                lib.function({ getString: ['char*', []] });
                return testGetStringAsync('char* getString()');
            });

            it('should handle out arguments', function () {
                lib.function({ getNumbers: ['void', ['double**', ref.refType('size_t')]] });
                return testGetNumbersAsync('void getNumbers(double** arg0, size_t* arg1)');
            });

            it('should support callbacks', function () {
                lib
                    .callback({ TMakeIntFunc: ['int', [ref.types.float, 'double']] })
                    .function({ makeInt: ['int', ['float', 'double', 'TMakeIntFunc']] });

                return testMakeIntAsync(
                    'int TMakeIntFunc(float arg0, double arg1)',
                    'int makeInt(float arg0, double arg1, TMakeIntFunc arg2)');
            });
        });

        describe('string declaration', function () {
            it('should invoke "mul" with "declare"', function () {
                // Argument name is optional:
                lib.function('int mul(int value, int)');
                return testMulAsync('int mul(int value, int arg1)');
            });

            it('should invoke "mul" with "declareAsync"', function () {
                // Argument name is optional:
                lib.function('int mul(int, int by)');
                return testMulAsync('int mul(int arg0, int by)');
            });

            it("should send Node.js Buffer's memory content to native code", function () {
                lib.function('long readLongPtr(long* ptr, uint offset)');
                return testReadLongPtrAsync('long readLongPtr(long* ptr, uint offset)');
            });

            it("should allow to write Node.js's string content in native code", function () {
                lib.function('void writeString(char* )');
                return testWriteStringAsync('void writeString(char* arg0)');
            });

            it("should pass null in place of pointers", function () {
                lib.function('void writeString(char*ch)');
                return testPassNullAsync('void writeString(char* ch)');
            });

            it("should fail on non pointer argument in place of pointer", function () {
                lib.function('void writeString(char * ch )');
                return testPassNonPointerAsync('void writeString(char* ch)');
            });

            it('should read natvie memory', function () {
                lib.function('char *getString()');
                return testGetStringAsync('char* getString()');
            });

            it('should handle out arguments', function () {
                lib.function('  void   getNumbers ( double *  * nums , size_t*count) ');
                return testGetNumbersAsync('void getNumbers(double** nums, size_t* count)');
            });

            it('should support callbacks', function () {
                lib
                    .callback('int TMakeIntFunc(float fv, double)')
                    .function('int makeInt(float , double dv, TMakeIntFunc func)');

                return testMakeIntAsync(
                    'int TMakeIntFunc(float fv, double arg1)',
                    'int makeInt(float arg0, double dv, TMakeIntFunc func)');
            });
        });

        var testMulAsync = async(function* (declaration) {
            assert(lib.functions);
            assert(lib.functions.mul);
            assert(lib.interface);
            assert(_.isFunction(lib.interface.mul));
            const mul = lib.interface.mul;

            // Verify metadata:
            assert(mul.function);
            assert.equal(mul.function.toString(), declaration);
            assert.equal(mul.function.name, 'mul');
            assert.equal(mul.function.resultType.name, 'int');
            assert.equal(mul.function.args.length, 2);
            assert(_.isString(mul.function.args[0].name));
            assert.equal(mul.function.args[0].type.name, 'int');
            assert(_.isString(mul.function.args[1].name));
            assert.equal(mul.function.args[1].type.name, 'int');

            // Call!
            assert.equal(yield mul(2, 2), 4);
            assert.equal(yield mul(10, 2), 20);
            assert.equal(yield mul(10, "3"), 30);
            assert.equal(yield mul(10.1, 2.1), 20);
            assert.equal(yield mul(yield mul(4, 4), 2), 32);

            // Zero is the default:
            assert.equal(yield mul(10), 0);
            assert.equal(yield mul(), 0);
            assert.equal(yield mul("a", "b"), 0);
        });

        var testReadLongPtrAsync = async(function* (declaration) {
            const readLongPtr = lib.interface.readLongPtr;
            assert(_.isFunction(readLongPtr));
            assert.equal(readLongPtr.function.toString(), declaration);
            const long = ref.types.long;
            const data = new Buffer(long.size * 2);
            long.set(data, 0, 1);
            long.set(data, long.size, 42);
            assert.equal(yield readLongPtr(data, 0), 1);
            assert.equal(yield readLongPtr(data, 1), 42);
        });

        var testWriteStringAsync = async(function* (declaration) {
            const writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert.equal(writeString.function.toString(), declaration);
            const string = ref.allocCString('          ');
            yield writeString(string);
            assert.equal(ref.readCString(string), 'hello');
        });

        var testPassNullAsync = async(function* (declaration) {
            const writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            // should not crash:
            yield writeString(null);
            yield writeString(ref.NULL);
        });

        var testPassNonPointerAsync = async(function* (declaration) {
            const writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            try {
                yield writeString(42);
                assert(false);
            }
            catch (err) {
            }
            try {
                yield writeString();
                assert(false);
            }
            catch (err) {
            }
        });

        var testGetStringAsync = async(function* (declaration) {
            const getString = lib.interface.getString;
            assert(_.isFunction(getString));
            assert.equal(getString.function.toString(), declaration);
            const string = yield getString();
            assert(_.isBuffer(string));
            assert(_.isObject(string.type));
            assert.equal(string.type.name, 'char');
            assert.equal(string.type.indirection, 1);
            assert.equal(ref.readCString(string), 'world');
        });

        // void getNumbers(double** nums, size_t* size)
        var testGetNumbersAsync = async(function* (declaration) {
            const getNumbers = lib.interface.getNumbers;
            assert(_.isFunction(getNumbers));
            assert.equal(getNumbers.function.toString(), declaration);

            const double = ref.types.double;
            const doublePtrType = ref.refType(double);
            const doublePtrPtr = ref.alloc(doublePtrType);
            const sizeTPtr = ref.alloc('size_t');
            yield getNumbers(doublePtrPtr, sizeTPtr);

            const size = ref.deref(sizeTPtr);
            assert.equal(size, 3);
            let doublePtr = ref.deref(doublePtrPtr);
            assert(_.isBuffer(doublePtr));
            const first = ref.deref(doublePtr);
            assert(_.isNumber(first));
            assert.equal(first, 1.1);
            doublePtr = ref.reinterpret(doublePtr, size * double.size);
            assert.equal(double.get(doublePtr, 1 * double.size), 2.2);
            assert.equal(double.get(doublePtr, 2 * double.size), 3.3);
        });

        var testMakeIntAsync = async(function* (callbackDecl, funcDecl) {
            const TMakeIntFunc = lib.interface.TMakeIntFunc;
            assert(_.isFunction(TMakeIntFunc));
            assert(TMakeIntFunc.callback);
            assert.equal(TMakeIntFunc.callback.toString(), callbackDecl);

            const makeInt = lib.interface.makeInt;
            assert(_.isFunction(makeInt));
            assert.equal(makeInt.function.toString(), funcDecl);

            const predeclaredCallback = TMakeIntFunc((fv, dv) => fv + dv);

            let result = yield makeInt(1.1, 2.2, predeclaredCallback);
            assert.equal(result, Math.floor((1.1 + 2.2) * 2));
        });
    });

    describe('types', function () {
        it('supports 64 bit integers', function () {
            const lib = new Library(libPath);
            lib.declare('short uint64ToShort(uint64 val)');
            const uint64ToShort = lib.interface.uint64ToShort;
            assert(_.isFunction(uint64ToShort));
            assert.strictEqual(uint64ToShort(0), 0);
            assert.strictEqual(uint64ToShort(16), 16);
            assert.strictEqual(uint64ToShort("42"), 42);
        });
    });
});