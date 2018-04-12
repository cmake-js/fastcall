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

describe('Synchronization Modes', function () {
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

    describe('lock', function () {
        var lockCounter = null;

        beforeEach(function () {
            lib = new Library(libPath, { syncMode: Library.syncMode.lock });
            assert.equal(lib.options.syncMode, Library.syncMode.lock);
            assert(lib.synchronized);
            assert(!lib.queued);
            lockCounter = null;
            var oldLock = lib._lock;
            assert(_.isFunction(oldLock));
            var oldUnlock = lib._unlock;
            assert(_.isFunction(oldUnlock));
            lib._lock = function () {
                lockCounter = (lockCounter || 0) + 1;
                assert(lib._mutex instanceof Buffer);
                return oldLock.call(lib);
            };
            lib._unlock = function () {
                --lockCounter;
                assert(lockCounter >= 0);
                assert(lib._mutex instanceof Buffer);
                return oldUnlock.call(lib);
            };
        });

        afterEach(function () {
            lib.release();
        });

        describe('sync', function () {
            it('should create and use a mutex', function () {
                lib.syncFunction('int mul(int value, int by)');
                assert.equal(lib.interface.mul(21, 2), 42);
                assert.strictEqual(lockCounter, 0);
            });
        });

        describe('async', function () {
            it('should create and use a mutex', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                    while (1) {
                        switch (_context2.prev = _context2.next) {
                            case 0:
                                lib.asyncFunction('int mul(int value, int by)');
                                _context2.t0 = assert;
                                _context2.next = 4;
                                return lib.interface.mul(21, 2);

                            case 4:
                                _context2.t1 = _context2.sent;

                                _context2.t0.equal.call(_context2.t0, _context2.t1, 42);

                                assert.strictEqual(lockCounter, 0);

                            case 7:
                            case 'end':
                                return _context2.stop();
                        }
                    }
                }, _callee2, this);
            })));
        });
    });

    describe('queue', function () {
        beforeEach(function () {
            lib = new Library(libPath, { syncMode: Library.syncMode.queue });
            assert.equal(lib.options.syncMode, Library.syncMode.queue);
            assert(!lib.synchronized);
            assert(lib.queued);
        });

        afterEach(function () {
            lib.release();
        });

        describe('sync', function () {
            it('should fail when there are async operations in the queue', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                var syncMul, asyncMul, promises, i;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                lib.syncFunction('int mul(int value, int by)');
                                syncMul = lib.interface.mul;
                                asyncMul = syncMul.async;
                                // sync ok:

                                assert.equal(syncMul(21, 2), 42);
                                // async ok:
                                _context3.t0 = assert;
                                _context3.next = 7;
                                return asyncMul(21, 2);

                            case 7:
                                _context3.t1 = _context3.sent;

                                _context3.t0.equal.call(_context3.t0, _context3.t1, 42);

                                promises = [];

                                for (i = 0; i < 100; i++) {
                                    promises.push(asyncMul(21, 2));
                                }

                                _context3.prev = 11;

                                syncMul(21, 2);
                                assert(false, 'unreachable');
                                _context3.next = 20;
                                break;

                            case 16:
                                _context3.prev = 16;
                                _context3.t2 = _context3['catch'](11);

                                assert(!/unreachable/.test(_context3.t2.message));
                                assert(/forbidden/.test(_context3.t2.message));

                            case 20:
                                _context3.prev = 20;
                                _context3.next = 23;
                                return Promise.all(promises);

                            case 23:
                                return _context3.finish(20);

                            case 24:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this, [[11, 16, 20, 24]]);
            })));
        });

        describe('async', function () {
            it('should queue asyncronous function calls', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                var promises, strBuff, a, reference, i, str;
                return regeneratorRuntime.wrap(function _callee4$(_context4) {
                    while (1) {
                        switch (_context4.prev = _context4.next) {
                            case 0:
                                lib.asyncFunction('void appendChar(char* str, uint pos, char charCode)');

                                promises = [];
                                strBuff = alloc(21);
                                a = 'a'.charCodeAt(0);
                                reference = '';

                                for (i = 0; i < 20; i++) {
                                    promises.push(lib.interface.appendChar(strBuff, i, a + i));
                                    reference += String.fromCharCode(a + i);
                                }
                                _context4.next = 8;
                                return Promise.all(promises);

                            case 8:
                                str = ref.readCString(strBuff, 0);

                                assert.equal(str, reference);

                            case 10:
                            case 'end':
                                return _context4.stop();
                        }
                    }
                }, _callee4, this);
            })));
        });
    });
});

function alloc(size) {
    if (Buffer.alloc) {
        Buffer.alloc(size);
    }
    var buff = new Buffer(size);
    buff.fill(0);
    return buff;
}
//# sourceMappingURL=synchModes.js.map