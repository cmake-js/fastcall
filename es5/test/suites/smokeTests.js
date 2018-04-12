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

describe('Library', function () {
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

    describe('initialize', function () {
        describe('without options', function () {
            it('should init in sync mode as default', function () {
                var lib = new Library(libPath);
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                } finally {
                    lib.release();
                }
            });
        });

        describe('with options', function () {
            it('should init in sync mode explicitly', function () {
                var lib = new Library(libPath, { defaultCallMode: Library.callMode.sync });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                } finally {
                    lib.release();
                }
            });

            it('should init in async mode explicitly', function () {
                var lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.async);
                } finally {
                    lib.release();
                }
            });

            it('should throw when mode is unknown', function () {
                assert.throws(function () {
                    var lib = new Library(libPath, { defaultCallMode: 42 });
                });
            });
        });
    });

    describe('sync call mode (smoke test)', function () {
        var lib = null;

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
                lib.callback({ TMakeIntFunc: ['int', [ref.types.float, 'double']] }).function({ makeInt: ['int', ['float', 'double', 'TMakeIntFunc']] });

                testMakeIntSync('int TMakeIntFunc(float arg0, double arg1)', 'int makeInt(float arg0, double arg1, TMakeIntFunc arg2)');
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
                lib.callback('int TMakeIntFunc(float fv, double)').function('int makeInt(float , double dv, TMakeIntFunc func)');

                testMakeIntSync('int TMakeIntFunc(float fv, double arg1)', 'int makeInt(float arg0, double dv, TMakeIntFunc func)');
            });
        });

        function testMulSync(declaration) {
            assert(lib.functions);
            assert(lib.functions.mul);
            assert(lib.interface);
            assert(_.isFunction(lib.interface.mul));
            var mul = lib.interface.mul;

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
            var readLongPtr = lib.interface.readLongPtr;
            assert(_.isFunction(readLongPtr));
            assert(readLongPtr.function);
            assert.equal(readLongPtr.function.toString(), declaration);
            var long = ref.types.long;
            var data = new Buffer(long.size * 2);
            long.set(data, 0, 1);
            long.set(data, long.size, 42);
            assert.equal(readLongPtr(data, 0), 1);
            assert.equal(readLongPtr(data, 1), 42);
        }

        function testWriteStringSync(declaration) {
            var writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            var string = ref.allocCString('          ');
            writeString(string);
            assert.equal(ref.readCString(string), 'hello');
        }

        function testPassNullSync(declaration) {
            var writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            // should not crash:
            writeString(null);
            writeString(ref.NULL);
        }

        function testPassNonPointerSync(declaration) {
            var writeString = lib.interface.writeString;
            assert(_.isFunction(writeString));
            assert(writeString.function);
            assert.equal(writeString.function.toString(), declaration);
            assert.throws(function () {
                writeString(42);
            });
            assert.throws(function () {
                writeString();
            });
        }

        function testGetStringSync(declaration) {
            var getString = lib.interface.getString;
            assert(_.isFunction(getString));
            assert(getString.function);
            assert.equal(getString.function.toString(), declaration);
            var string = getString();
            assert(_.isBuffer(string));
            assert(_.isObject(string.type));
            assert.equal(string.type.name, 'char');
            assert.equal(string.type.indirection, 1);
            assert.equal(string.length, 0);
            assert.equal(ref.readCString(string), 'world');
        }

        // void getNumbers(double** nums, size_t* size)
        function testGetNumbersSync(declaration) {
            var getNumbers = lib.interface.getNumbers;
            assert(_.isFunction(getNumbers));
            assert.equal(getNumbers.function.toString(), declaration);

            var double = ref.types.double;
            var doublePtrType = ref.refType(double);
            var doublePtrPtr = ref.alloc(doublePtrType);
            var sizeTPtr = ref.alloc('size_t');
            getNumbers(doublePtrPtr, sizeTPtr);

            var size = ref.deref(sizeTPtr);
            assert.equal(size, 3);
            var doublePtr = ref.deref(doublePtrPtr);
            assert(_.isBuffer(doublePtr));
            var first = ref.deref(doublePtr);
            assert(_.isNumber(first));
            assert.equal(first, 1.1);
            doublePtr = ref.reinterpret(doublePtr, size * double.size);
            assert.equal(double.get(doublePtr, 1 * double.size), 2.2);
            assert.equal(double.get(doublePtr, 2 * double.size), 3.3);
        }

        function testMakeIntSync(callbackDecl, funcDecl) {
            var TMakeIntFunc = lib.interface.TMakeIntFunc;
            assert(_.isFunction(TMakeIntFunc));
            assert(TMakeIntFunc.callback);
            assert.equal(TMakeIntFunc.callback.toString(), callbackDecl);

            var makeInt = lib.interface.makeInt;
            assert(_.isFunction(makeInt));
            assert.equal(makeInt.function.toString(), funcDecl);

            var result = makeInt(1.1, 2.2, function (fv, dv) {
                return fv + dv;
            });
            assert.equal(result, Math.floor((1.1 + 2.2) * 2));
        }
    });

    describe('async call mode (smoke test)', function () {
        var lib = null;

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
                lib.callback({ TMakeIntFunc: ['int', [ref.types.float, 'double']] }).function({ makeInt: ['int', ['float', 'double', 'TMakeIntFunc']] });

                return testMakeIntAsync('int TMakeIntFunc(float arg0, double arg1)', 'int makeInt(float arg0, double arg1, TMakeIntFunc arg2)');
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
                lib.callback('int TMakeIntFunc(float fv, double)').function('int makeInt(float , double dv, TMakeIntFunc func)');

                return testMakeIntAsync('int TMakeIntFunc(float fv, double arg1)', 'int makeInt(float arg0, double dv, TMakeIntFunc func)');
            });
        });

        var testMulAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(declaration) {
            var mul;
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            assert(lib.functions);
                            assert(lib.functions.mul);
                            assert(lib.interface);
                            assert(_.isFunction(lib.interface.mul));
                            mul = lib.interface.mul;

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
                            _context2.t0 = assert;
                            _context2.next = 17;
                            return mul(2, 2);

                        case 17:
                            _context2.t1 = _context2.sent;

                            _context2.t0.equal.call(_context2.t0, _context2.t1, 4);

                            _context2.t2 = assert;
                            _context2.next = 22;
                            return mul(10, 2);

                        case 22:
                            _context2.t3 = _context2.sent;

                            _context2.t2.equal.call(_context2.t2, _context2.t3, 20);

                            _context2.t4 = assert;
                            _context2.next = 27;
                            return mul(10, "3");

                        case 27:
                            _context2.t5 = _context2.sent;

                            _context2.t4.equal.call(_context2.t4, _context2.t5, 30);

                            _context2.t6 = assert;
                            _context2.next = 32;
                            return mul(10.1, 2.1);

                        case 32:
                            _context2.t7 = _context2.sent;

                            _context2.t6.equal.call(_context2.t6, _context2.t7, 20);

                            _context2.t8 = assert;
                            _context2.t9 = mul;
                            _context2.next = 38;
                            return mul(4, 4);

                        case 38:
                            _context2.t10 = _context2.sent;
                            _context2.next = 41;
                            return (0, _context2.t9)(_context2.t10, 2);

                        case 41:
                            _context2.t11 = _context2.sent;

                            _context2.t8.equal.call(_context2.t8, _context2.t11, 32);

                            _context2.t12 = assert;
                            _context2.next = 46;
                            return mul(10);

                        case 46:
                            _context2.t13 = _context2.sent;

                            _context2.t12.equal.call(_context2.t12, _context2.t13, 0);

                            _context2.t14 = assert;
                            _context2.next = 51;
                            return mul();

                        case 51:
                            _context2.t15 = _context2.sent;

                            _context2.t14.equal.call(_context2.t14, _context2.t15, 0);

                            _context2.t16 = assert;
                            _context2.next = 56;
                            return mul("a", "b");

                        case 56:
                            _context2.t17 = _context2.sent;

                            _context2.t16.equal.call(_context2.t16, _context2.t17, 0);

                        case 58:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        }));

        var testReadLongPtrAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(declaration) {
            var readLongPtr, long, data;
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            readLongPtr = lib.interface.readLongPtr;

                            assert(_.isFunction(readLongPtr));
                            assert.equal(readLongPtr.function.toString(), declaration);
                            long = ref.types.long;
                            data = new Buffer(long.size * 2);

                            long.set(data, 0, 1);
                            long.set(data, long.size, 42);
                            _context3.t0 = assert;
                            _context3.next = 10;
                            return readLongPtr(data, 0);

                        case 10:
                            _context3.t1 = _context3.sent;

                            _context3.t0.equal.call(_context3.t0, _context3.t1, 1);

                            _context3.t2 = assert;
                            _context3.next = 15;
                            return readLongPtr(data, 1);

                        case 15:
                            _context3.t3 = _context3.sent;

                            _context3.t2.equal.call(_context3.t2, _context3.t3, 42);

                        case 17:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, this);
        }));

        var testWriteStringAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(declaration) {
            var writeString, string;
            return regeneratorRuntime.wrap(function _callee4$(_context4) {
                while (1) {
                    switch (_context4.prev = _context4.next) {
                        case 0:
                            writeString = lib.interface.writeString;

                            assert(_.isFunction(writeString));
                            assert.equal(writeString.function.toString(), declaration);
                            string = ref.allocCString('          ');
                            _context4.next = 6;
                            return writeString(string);

                        case 6:
                            assert.equal(ref.readCString(string), 'hello');

                        case 7:
                        case 'end':
                            return _context4.stop();
                    }
                }
            }, _callee4, this);
        }));

        var testPassNullAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(declaration) {
            var writeString;
            return regeneratorRuntime.wrap(function _callee5$(_context5) {
                while (1) {
                    switch (_context5.prev = _context5.next) {
                        case 0:
                            writeString = lib.interface.writeString;

                            assert(_.isFunction(writeString));
                            assert(writeString.function);
                            assert.equal(writeString.function.toString(), declaration);
                            // should not crash:
                            _context5.next = 6;
                            return writeString(null);

                        case 6:
                            _context5.next = 8;
                            return writeString(ref.NULL);

                        case 8:
                        case 'end':
                            return _context5.stop();
                    }
                }
            }, _callee5, this);
        }));

        var testPassNonPointerAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(declaration) {
            var writeString;
            return regeneratorRuntime.wrap(function _callee6$(_context6) {
                while (1) {
                    switch (_context6.prev = _context6.next) {
                        case 0:
                            writeString = lib.interface.writeString;

                            assert(_.isFunction(writeString));
                            assert(writeString.function);
                            assert.equal(writeString.function.toString(), declaration);
                            _context6.prev = 4;
                            _context6.next = 7;
                            return writeString(42);

                        case 7:
                            assert(false);
                            _context6.next = 12;
                            break;

                        case 10:
                            _context6.prev = 10;
                            _context6.t0 = _context6['catch'](4);

                        case 12:
                            _context6.prev = 12;
                            _context6.next = 15;
                            return writeString();

                        case 15:
                            assert(false);
                            _context6.next = 20;
                            break;

                        case 18:
                            _context6.prev = 18;
                            _context6.t1 = _context6['catch'](12);

                        case 20:
                        case 'end':
                            return _context6.stop();
                    }
                }
            }, _callee6, this, [[4, 10], [12, 18]]);
        }));

        var testGetStringAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(declaration) {
            var getString, string;
            return regeneratorRuntime.wrap(function _callee7$(_context7) {
                while (1) {
                    switch (_context7.prev = _context7.next) {
                        case 0:
                            getString = lib.interface.getString;

                            assert(_.isFunction(getString));
                            assert.equal(getString.function.toString(), declaration);
                            _context7.next = 5;
                            return getString();

                        case 5:
                            string = _context7.sent;

                            assert(_.isBuffer(string));
                            assert(_.isObject(string.type));
                            assert.equal(string.type.name, 'char');
                            assert.equal(string.type.indirection, 1);
                            assert.equal(ref.readCString(string), 'world');

                        case 11:
                        case 'end':
                            return _context7.stop();
                    }
                }
            }, _callee7, this);
        }));

        // void getNumbers(double** nums, size_t* size)
        var testGetNumbersAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(declaration) {
            var getNumbers, double, doublePtrType, doublePtrPtr, sizeTPtr, size, doublePtr, first;
            return regeneratorRuntime.wrap(function _callee8$(_context8) {
                while (1) {
                    switch (_context8.prev = _context8.next) {
                        case 0:
                            getNumbers = lib.interface.getNumbers;

                            assert(_.isFunction(getNumbers));
                            assert.equal(getNumbers.function.toString(), declaration);

                            double = ref.types.double;
                            doublePtrType = ref.refType(double);
                            doublePtrPtr = ref.alloc(doublePtrType);
                            sizeTPtr = ref.alloc('size_t');
                            _context8.next = 9;
                            return getNumbers(doublePtrPtr, sizeTPtr);

                        case 9:
                            size = ref.deref(sizeTPtr);

                            assert.equal(size, 3);
                            doublePtr = ref.deref(doublePtrPtr);

                            assert(_.isBuffer(doublePtr));
                            first = ref.deref(doublePtr);

                            assert(_.isNumber(first));
                            assert.equal(first, 1.1);
                            doublePtr = ref.reinterpret(doublePtr, size * double.size);
                            assert.equal(double.get(doublePtr, 1 * double.size), 2.2);
                            assert.equal(double.get(doublePtr, 2 * double.size), 3.3);

                        case 19:
                        case 'end':
                            return _context8.stop();
                    }
                }
            }, _callee8, this);
        }));

        var testMakeIntAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(callbackDecl, funcDecl) {
            var TMakeIntFunc, makeInt, predeclaredCallback, result;
            return regeneratorRuntime.wrap(function _callee9$(_context9) {
                while (1) {
                    switch (_context9.prev = _context9.next) {
                        case 0:
                            TMakeIntFunc = lib.interface.TMakeIntFunc;

                            assert(_.isFunction(TMakeIntFunc));
                            assert(TMakeIntFunc.callback);
                            assert.equal(TMakeIntFunc.callback.toString(), callbackDecl);

                            makeInt = lib.interface.makeInt;

                            assert(_.isFunction(makeInt));
                            assert.equal(makeInt.function.toString(), funcDecl);

                            predeclaredCallback = TMakeIntFunc(function (fv, dv) {
                                return fv + dv;
                            });
                            _context9.next = 10;
                            return makeInt(1.1, 2.2, predeclaredCallback);

                        case 10:
                            result = _context9.sent;

                            assert.equal(result, Math.floor((1.1 + 2.2) * 2));

                        case 12:
                        case 'end':
                            return _context9.stop();
                    }
                }
            }, _callee9, this);
        }));
    });

    describe('types', function () {
        it('supports 64 bit integers', function () {
            var lib = new Library(libPath);
            lib.declare('short uint64ToShort(uint64 val)');
            var uint64ToShort = lib.interface.uint64ToShort;
            assert(_.isFunction(uint64ToShort));
            assert.strictEqual(uint64ToShort(0), 0);
            assert.strictEqual(uint64ToShort(16), 16);
            assert.strictEqual(uint64ToShort("42"), 42);
        });
    });
});
//# sourceMappingURL=smokeTests.js.map