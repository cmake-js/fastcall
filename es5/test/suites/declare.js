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

describe('Library.declare()', function () {
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

    afterEach(function () {
        lib.release();
    });

    var declaration = 'int mul( int value, int by );' + 'int (*TMakeIntFunc)(float fv, double);' + 'int makeInt(float , double dv, TMakeIntFunc func);' + 'float[] TFloats;' + 'struct TStuff { TFloats more; };' + 'union T42 { int v1; double v2 };';

    describe('sync', function () {
        it('should declare stuff as sync by default', function () {
            lib = new Library(libPath);
            lib.declare(declaration);
            testSyncInterface();
            testRefInterface();
        });

        it('should declare stuff as sync if options.callMode is different', function () {
            lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
            lib.declareSync(declaration);
            testSyncInterface();
            testRefInterface();
        });
    });

    describe('async', function () {
        it('should declare stuff as async by default if options.callMode is async', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
            return regeneratorRuntime.wrap(function _callee2$(_context2) {
                while (1) {
                    switch (_context2.prev = _context2.next) {
                        case 0:
                            lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
                            lib.declare(declaration);
                            _context2.next = 4;
                            return testAsyncInterface();

                        case 4:
                            testRefInterface();

                        case 5:
                        case 'end':
                            return _context2.stop();
                    }
                }
            }, _callee2, this);
        })));

        it('should declare stuff as async if options.callMode is different', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
            return regeneratorRuntime.wrap(function _callee3$(_context3) {
                while (1) {
                    switch (_context3.prev = _context3.next) {
                        case 0:
                            lib = new Library(libPath, { defaultCallMode: Library.callMode.sync });
                            lib.declareAsync(declaration);
                            _context3.next = 4;
                            return testAsyncInterface();

                        case 4:
                            testRefInterface();

                        case 5:
                        case 'end':
                            return _context3.stop();
                    }
                }
            }, _callee3, this);
        })));
    });

    function testSyncInterface() {
        assert(_.isFunction(lib.interface.mul));
        assert(_.isObject(lib.interface.mul.function));
        assert.strictEqual(lib.interface.mul.function, lib.functions.mul);
        assert.equal(lib.interface.mul.function.toString(), 'int mul(int value, int by)');

        assert.equal(lib.interface.mul(2, 2), 4);

        assert(_.isFunction(lib.interface.makeInt));
        assert(_.isObject(lib.interface.makeInt.function));
        assert.strictEqual(lib.interface.makeInt.function, lib.functions.makeInt);
        assert.equal(lib.interface.makeInt.function.toString(), 'int makeInt(float arg0, double dv, TMakeIntFunc func)');
        assert(_.isFunction(lib.interface.TMakeIntFunc));
        assert(_.isObject(lib.interface.TMakeIntFunc.callback));
        assert.strictEqual(lib.interface.TMakeIntFunc.callback, lib.callbacks.TMakeIntFunc);
        assert.equal(lib.interface.TMakeIntFunc.callback.toString(), 'int TMakeIntFunc(float fv, double arg1)');

        var result = lib.interface.makeInt(1.1, 2.2, function (fv, dv) {
            return fv + dv;
        });
        assert.equal(result, Math.floor((1.1 + 2.2) * 2));
    }

    var testAsyncInterface = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
        var result;
        return regeneratorRuntime.wrap(function _callee4$(_context4) {
            while (1) {
                switch (_context4.prev = _context4.next) {
                    case 0:
                        assert(_.isFunction(lib.interface.mul));
                        assert(_.isObject(lib.interface.mul.function));
                        assert.strictEqual(lib.interface.mul.function, lib.functions.mul);
                        assert.equal(lib.interface.mul.function.toString(), 'int mul(int value, int by)');

                        _context4.t0 = assert;
                        _context4.next = 7;
                        return lib.interface.mul(2, 2);

                    case 7:
                        _context4.t1 = _context4.sent;

                        _context4.t0.equal.call(_context4.t0, _context4.t1, 4);

                        assert(_.isFunction(lib.interface.makeInt));
                        assert(_.isObject(lib.interface.makeInt.function));
                        assert.strictEqual(lib.interface.makeInt.function, lib.functions.makeInt);
                        assert.equal(lib.interface.makeInt.function.toString(), 'int makeInt(float arg0, double dv, TMakeIntFunc func)');
                        assert(_.isFunction(lib.interface.TMakeIntFunc));
                        assert(_.isObject(lib.interface.TMakeIntFunc.callback));
                        assert.strictEqual(lib.interface.TMakeIntFunc.callback, lib.callbacks.TMakeIntFunc);
                        assert.equal(lib.interface.TMakeIntFunc.callback.toString(), 'int TMakeIntFunc(float fv, double arg1)');

                        _context4.next = 19;
                        return lib.interface.makeInt(1.1, 2.2, function (fv, dv) {
                            return fv + dv;
                        });

                    case 19:
                        result = _context4.sent;

                        assert.equal(result, Math.floor((1.1 + 2.2) * 2));

                    case 21:
                    case 'end':
                        return _context4.stop();
                }
            }
        }, _callee4, this);
    }));

    function testRefInterface() {
        assert(_.isFunction(lib.interface.TFloats));
        assert(_.isObject(lib.interface.TFloats.array));
        assert.strictEqual(lib.interface.TFloats.array, lib.arrays.TFloats);
        assert.equal(lib.interface.TFloats.array.name, 'TFloats');
        var buff = lib.interface.TFloats([1, 2, 3]);
        assert(_.isBuffer(buff));
        assert.equal(buff.length, 3 * ref.types.float.size);

        assert(_.isFunction(lib.interface.TStuff));
        assert(_.isObject(lib.interface.TStuff.struct));
        assert.strictEqual(lib.interface.TStuff.struct, lib.structs.TStuff);
        assert.equal(lib.interface.TStuff.struct.name, 'TStuff');
        var rec = lib.structs.TStuff.type({ more: [1, 2, 3, 4] });
        assert.strictEqual(rec.more, rec.more);
        assert.equal(rec.more.get(0), 1);
        assert.equal(rec.more.get(1), 2);
        assert.equal(rec.more.get(2), 3);
        assert.equal(rec.more.get(3), 4);
        assert.equal(rec.more.length, 4);

        assert(_.isFunction(lib.interface.T42));
        assert(_.isObject(lib.interface.T42.union));
        assert.strictEqual(lib.interface.T42.union, lib.unions.T42);
        assert.equal(lib.interface.T42.union.name, 'T42');
        var uni = lib.unions.T42.type({ v1: 42 });
        assert.strictEqual(uni.v1, uni.v1);
        assert.equal(uni.v1, 42);
    }
});
//# sourceMappingURL=declare.js.map