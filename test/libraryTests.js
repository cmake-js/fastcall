'use strict';
const fastcall = require('..');
const Library = fastcall.Library;
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const ref = fastcall.ref;
const Promise = require('bluebird');
const async = Promise.coroutine;

describe('Library', function () {
    describe('initialize', function () {
        describe('without options', function () {
            it('should init in sync mode as default', function () {
                const libPath = helpers.findTestlib();
                const lib = new Library(libPath);
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                }
                finally {
                    lib.free();
                }
            });
        });

        describe('with options', function () {
            it('should init in sync mode explicitly', function () {
                const libPath = helpers.findTestlib();
                const lib = new Library(libPath, { defaultCallMode: Library.callMode.sync });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                }
                finally {
                    lib.free();
                }
            });

            it('should init in async mode explicitly', function () {
                const libPath = helpers.findTestlib();
                const lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.async);
                }
                finally {
                    lib.free();
                }
            });

            it('should throw when mode is unknown', function () {
                assert.throws(() => {
                    const libPath = helpers.findTestlib();
                    const lib = new Library(libPath, { defaultCallMode: 42 });
                });
            });
        });
    });

    describe('sync call mode (smoke test)', function () {
        const libPath = helpers.findTestlib();
        let lib = null;

        beforeEach(function () {
            lib = new Library(libPath);
        });

        afterEach(function () {
            lib.free();
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
            it('should invoke "mul" with "declare"', function () {
                // Argument name is optional:
                lib.function('int mul(int value, int)');
                testMulSync('int mul(int value, int arg1)');
            });

            it('should invoke "mul" with "declareSync"', function () {
                // Argument name is optional:
                lib.function('int mul(int, int by)');
                testMulSync('int mul(int arg0, int by)');
            });

            it("should send Node.js Buffer's memory content to native code", function () {
                lib.function('long readLongPtr(long* ptr, uint offset)');
                testReadLongPtrSync('long readLongPtr(long* ptr, uint offset)');
            });

            it("should allow to write Node.js's string content in native code", function () {
                lib.function('void writeString(char* )');
                testWriteStringSync('void writeString(char* arg0)');
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
            assert.equal(mul.declaration, declaration);
            assert.equal(mul.functionName, 'mul');
            assert.equal(mul.resultType.name, 'int');
            assert.equal(mul.args.length, 2);
            assert(_.isString(mul.args[0].name));
            assert.equal(mul.args[0].type.name, 'int');
            assert(_.isString(mul.args[1].name));
            assert.equal(mul.args[1].type.name, 'int');

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
            assert.equal(readLongPtr.declaration, declaration);
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
            assert.equal(writeString.declaration, declaration);
            const string = ref.allocCString('          ');
            writeString(string);
            assert.equal(ref.readCString(string), 'hello');
        }

        function testGetStringSync(declaration) {
            const getString = lib.interface.getString;
            assert(_.isFunction(getString));
            assert.equal(getString.declaration, declaration);
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
            assert.equal(getNumbers.declaration, declaration);
            
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
            assert.equal(TMakeIntFunc.declaration, callbackDecl);

            const makeInt = lib.interface.makeInt;
            assert(_.isFunction(makeInt));
            assert.equal(makeInt.declaration, funcDecl);

            let result = makeInt(1.1, 2.2, (fv, dv) => fv + dv);
            assert.equal(result, (1.1 + 2.2) * 2);
        }
    });

    describe('async call mode (smoke test)', function () {
        const libPath = helpers.findTestlib();
        let lib = null;

        beforeEach(function () {
            lib = new Library(libPath, {defaultCallMode: Library.callMode.async});
        });

        afterEach(function () {
            lib.free();
            lib = null;
        });

        describe('node-ffi style declaration', function () {
            it('should invoke "mul" with "declare"', function () {
                lib.function({ mul: ['int', [ref.types.int, 'int']] });
                return testMulAsync('int mul(int arg0, int arg1)');
            });

            it('should invoke "mul" with "declareAsync"', function () {
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

            it('should read natvie memory', function () {
                lib.function({ getString: ['char*', []] });
                return testGetStringAsync('char* getString()');
            });

            it('should handle out arguments', function () {
                lib.function({ getNumbers: ['void', ['double**', ref.refType('size_t')]] });
                return testGetNumbersAsync('void getNumbers(double** arg0, size_t* arg1)');
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

            it('should read natvie memory', function () {
                lib.function('char *getString()');
                return testGetStringAsync('char* getString()');
            });

            it('should handle out arguments', function () {
                lib.function('  void   getNumbers ( double *  * nums , size_t*count) ');
                return testGetNumbersAsync('void getNumbers(double** nums, size_t* count)');
            });
        });

        var testMulAsync = async(function *(declaration) {
            assert(lib.functions);
            assert(lib.functions.mul);
            assert(lib.interface);
            assert(_.isFunction(lib.interface.mul));
            const mul = lib.interface.mul;

            // Verify metadata:
            assert.equal(mul.declaration, declaration);
            assert.equal(mul.functionName, 'mul');
            assert.equal(mul.resultType.name, 'int');
            assert.equal(mul.args.length, 2);
            assert(_.isString(mul.args[0].name));
            assert.equal(mul.args[0].type.name, 'int');
            assert(_.isString(mul.args[1].name));
            assert.equal(mul.args[1].type.name, 'int');

            // Call!
            assert.equal(yield mul(2, 2).get(), 4);
            assert.equal(yield mul(10, 2).get(), 20);
            assert.equal(yield mul(10, "3").get(), 30);
            assert.equal(yield mul(10.1, 2.1).get(), 20);
            // Notice: async methods are chainable without getting their result to Node.js side!
            assert.equal(yield mul(mul(4, 4), 2).get(), 32);

            // Zero is the default:
            assert.equal(yield mul(10).get(), 0);
            assert.equal(yield mul().get(), 0);
            assert.equal(yield mul("a", "b").get(), 0);
        });

        var testReadLongPtrAsync = async(function *(declaration) {
            const readLongPtr = lib.interface.readLongPtr;
            assert(_.isFunction(readLongPtr));
            assert.equal(readLongPtr.declaration, declaration);
            const long = ref.types.long;
            const data = new Buffer(long.size * 2);
            long.set(data, 0, 1);
            long.set(data, long.size, 42);
            assert.equal(yield readLongPtr(data, 0).get(), 1);
            assert.equal(yield readLongPtr(data, 1).get(), 42);
        });

        var testWriteStringAsync = async(function *(declaration) {
            const writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert.equal(writeString.declaration, declaration);
            const string = ref.allocCString('          ');
            writeString(string);
            yield lib.synchronize();
            assert.equal(ref.readCString(string), 'hello');
        });

        var testGetStringAsync = async(function *(declaration) {
            const getString = lib.interface.getString;
            assert(_.isFunction(getString));
            assert.equal(getString.declaration, declaration);
            const string = yield getString().get();
            assert(_.isBuffer(string));
            assert(_.isObject(string.type));
            assert.equal(string.type.name, 'char');
            assert.equal(string.type.indirection, 1);
            assert.equal(ref.readCString(string), 'world');
        });

        // void getNumbers(double** nums, size_t* size)
        var testGetNumbersAsync = async(function *(declaration) {
            const getNumbers = lib.interface.getNumbers;
            assert(_.isFunction(getNumbers));
            assert.equal(getNumbers.declaration, declaration);
            
            const double = ref.types.double;
            const doublePtrType = ref.refType(double);
            const doublePtrPtr = ref.alloc(doublePtrType);
            const sizeTPtr = ref.alloc('size_t');
            yield getNumbers(doublePtrPtr, sizeTPtr).get();

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
    });
});