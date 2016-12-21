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
const _ = require('lodash');
const assert = require('assert');
const Promise = require('bluebird');
const async = Promise.coroutine;
const fastcall = require('../../lib');
const scope = fastcall.scope;
const Disposable = fastcall.Disposable;

class Tester extends Disposable {
}

describe('RAII scope', function () {
    before(function () {
        assert(global.gc, 'GC is not enabled.');
    });

    describe('sync', function () {
        it('should propagate value to parent scope', function () {
            let disposed = false;
            const dispose = () => disposed = true;
            scope(() => {
                scope(() => {
                    assert(!disposed);
                    const value = new Tester(dispose);
                    assert(!disposed);
                    return value;
                });
                assert(!disposed);
            });
            assert(disposed);
        });

        it('should detach value at root scope', function () {
            let disposed = false;
            const dispose = () => disposed = true;
            scope(() => {
                const result = scope(() => {
                    assert(!disposed);
                    const value = new Tester(dispose);
                    assert(!disposed);
                    return value;
                });
                assert(!disposed);
                return result;
            });
            assert(!disposed);
        });

        it('should propagate array to parent scope', function () {
            let disposed = false;
            const dispose = () => disposed = true;
            scope(() => {
                scope(() => {
                    assert(!disposed);
                    const value = new Tester(dispose);
                    assert(!disposed);
                    return [value];
                });
                assert(!disposed);
            });
            assert(disposed);
        });

        it('should propagate object to parent scope', function () {
            let disposed = false;
            const dispose = () => disposed = true;
            scope(() => {
                scope(() => {
                    assert(!disposed);
                    const value = new Tester(dispose);
                    assert(!disposed);
                    return { value };
                });
                assert(!disposed);
            });
            assert(disposed);
        });

        it('should propagate array of objects to parent scope', function () {
            let disposed = false;
            const dispose = () => disposed = true;
            scope(() => {
                scope(() => {
                    assert(!disposed);
                    const value = new Tester(dispose);
                    assert(!disposed);
                    return [{ value }, { value }];
                });
                assert(!disposed);
            });
            assert(disposed);
        });

        it('should throw when disposeFunction is asynchronous', function () {
            let disposed = false;
            const dispose = () => Promise.delay(1).then(() => disposed = true);
            assert.throws(() => {
                scope(() => {
                    scope(() => {
                        assert(!disposed);
                        const value = new Tester(dispose);
                        assert(!disposed);
                        return [{ value }, { value }];
                    });
                    assert(!disposed);
                });
            });
        });
    });

    describe('async', function () {
        it('should propagate value to parent scope', async(function* () {
            let disposed = false;
            const dispose = () => disposed = true;
            yield scope.async(function* () {
                yield scope.async(function* () {
                    assert(!disposed);
                    const value = new Tester(dispose);
                    assert(!disposed);
                    yield Promise.delay(1);
                    return value;
                });
                assert(!disposed);
            });
            assert(disposed);
        }));

        it('should support asynchronous dispose function', async(function* () {
            let counter = 0;
            const dispose = () => Promise.delay(10).then(() => counter++);
            yield scope.async(function* () {
                yield scope.async(function* () {
                    assert(!counter);
                    const value1 = new Tester(dispose);
                    const value2 = new Tester(dispose);
                    assert(!counter);
                    yield Promise.delay(1);
                    return value1;
                });
                assert.equal(counter, 1);
            });
            assert.equal(counter, 2);
        }));
    });

    describe('dispose', function () {
        describe('GC', function () {
            it('should call dispose function', function () {
                let counter = 0;
                const dispose = () => counter++;
                let value2;
                const f = () => {
                    const value = new Tester(dispose);
                    gc();
                    assert(!counter);
                    value2 = value;
                    value2 = new Tester(dispose, 42);
                    assert(!counter);
                    gc();
                };
                let value3 = new Tester(dispose);

                f();
                assert(!counter);
                gc();
                assert.equal(counter, 1);
                value2 = null;
                gc();
                assert.equal(counter, 2);
                value3.dispose();
                assert.equal(counter, 3);
                value3 = null;
                gc();
                assert.equal(counter, 3);
            });

            it('should call all dispose functions after reset', function () {
                let counter = 0;
                const dispose1 = () => counter++;
                const dispose2 = () => counter += 100;
                let test = new Tester(dispose1, 10);
                gc();
                assert(!counter);
                test.resetDisposable(dispose2);
                assert(!counter);
                gc();
                assert.equal(counter, 1);
                test.resetDisposable(dispose1);
                assert.equal(counter, 1);
                test.dispose();
                assert.equal(counter, 2);
                gc();
                assert.equal(counter, 102);
                test = null;
                gc();
                assert.equal(counter, 102);
            });
        });
    });
});