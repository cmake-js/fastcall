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
const Scoped = fastcall.Scoped;

class Disposable extends Scoped {
    constructor(dispose) {
        assert(_.isFunction(dispose));
        super();
        this.dispose = dispose;
    }
}

function doAsync(f) {
    return async(f)();
}

describe('RAII scope', function () {
    describe('sync', function () {
        it('should propagate value to parent scope', function () {
            let disposed = false;
            const dispose = () => disposed = true;
            scope(() => {
                scope(() => {
                    assert(!disposed);
                    const value = new Disposable(dispose);
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
                    const value = new Disposable(dispose);
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
                    const value = new Disposable(dispose);
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
                    const value = new Disposable(dispose);
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
                    const value = new Disposable(dispose);
                    assert(!disposed);
                    return [{ value }, { value }];
                });
                assert(!disposed);
            });
            assert(disposed);
        });
    });

    describe('async', function () {
        it('should propagate value to parent scope', function () {
            return doAsync(function* () {
                let disposed = false;
                const dispose = () => disposed = true;
                yield scope.async(function* () {
                    yield scope.async(function* () {
                        assert(!disposed);
                        const value = new Disposable(dispose);
                        assert(!disposed);
                        yield Promise.delay(1);
                        return value;
                    });
                    assert(!disposed);
                });
                assert(disposed);
            });
        });
    });
});