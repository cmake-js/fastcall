'use strict';
const _ = require('lodash');
const assert = require('assert');
const Promise = require('bluebird');
const async = Promise.coroutine;
const fastcall = require('..');
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