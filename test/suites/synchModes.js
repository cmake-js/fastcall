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

describe(`Synchronization Modes`, function () {
    let libPath = null;
    let lib = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

    describe('lock', function () {
        let lockCounter = null;

        beforeEach(function () {
            lib = new Library(libPath, { syncMode: Library.syncMode.lock });
            assert.equal(lib.options.syncMode, Library.syncMode.lock);
            assert(lib.synchronized);
            assert(!lib.queued);
            lockCounter = null;
            const oldLock = lib._lock;
            assert(_.isFunction(oldLock));
            const oldUnlock = lib._unlock;
            assert(_.isFunction(oldUnlock));
            lib._lock = () => {
                lockCounter = (lockCounter || 0) + 1;
                assert(lib._mutex instanceof Buffer);
                return oldLock.call(lib);
            };
            lib._unlock = () => {
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
            it('should create and use a mutex', async(function* () {
                lib.asyncFunction('int mul(int value, int by)');
                assert.equal(yield lib.interface.mul(21, 2), 42);
                assert.strictEqual(lockCounter, 0);         
            }));
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
            it('should fail when there are async operations in the queue', async(function* () {
                lib.syncFunction('int mul(int value, int by)');
                const syncMul = lib.interface.mul;
                const asyncMul = syncMul.async;
                // sync ok:
                assert.equal(syncMul(21, 2), 42);
                // async ok:
                assert.equal(yield asyncMul(21, 2), 42);

                const promises = [];
                for (let i = 0; i < 100; i++) {
                    promises.push(asyncMul(21, 2));
                }
                
                try {
                    syncMul(21, 2);
                    assert(false, 'unreachable');
                }
                catch (err) {
                    assert(!/unreachable/.test(err.message));
                    assert(/forbidden/.test(err.message));
                }
                finally {
                    yield Promise.all(promises);
                }
            }));
        });

        describe('async', function () {
            it('should queue asyncronous function calls', async(function* () {
                lib.asyncFunction('void appendChar(char* str, uint pos, char charCode)');

                const promises = [];
                const strBuff = alloc(21);
                const a = 'a'.charCodeAt(0);
                let reference = '';
                for (let i = 0; i < 20; i++) {
                    promises.push(lib.interface.appendChar(strBuff, i, a + i));
                    reference += String.fromCharCode(a + i);
                }
                yield Promise.all(promises);
                const str = ref.readCString(strBuff, 0);
                assert.equal(str, reference);
            }));
        });
    });
});

function alloc(size) {
    if (Buffer.alloc) {
        Buffer.alloc(size);
    }
    const buff = new Buffer(size);
    buff.fill(0);
    return buff;
}