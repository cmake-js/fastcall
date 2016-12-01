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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var assert = require('assert');
var Promise = require('bluebird');
var async = Promise.coroutine;
var fastcall = require('../../lib');
var scope = fastcall.scope;
var Disposable = fastcall.Disposable;

var Tester = function (_Disposable) {
    _inherits(Tester, _Disposable);

    function Tester(disposeFunction, memUse) {
        _classCallCheck(this, Tester);

        return _possibleConstructorReturn(this, (Tester.__proto__ || Object.getPrototypeOf(Tester)).call(this, disposeFunction, memUse));
    }

    return Tester;
}(Disposable);

function doAsync(f) {
    return async(f)();
}

describe('RAII scope', function () {
    before(function () {
        assert(global.gc, 'GC is not enabled.');
    });

    describe('sync', function () {
        it('should propagate value to parent scope', function () {
            var disposed = false;
            var dispose = function dispose() {
                return disposed = true;
            };
            scope(function () {
                scope(function () {
                    assert(!disposed);
                    var value = new Tester(dispose);
                    assert(!disposed);
                    return value;
                });
                assert(!disposed);
            });
            assert(disposed);
        });

        it('should detach value at root scope', function () {
            var disposed = false;
            var dispose = function dispose() {
                return disposed = true;
            };
            scope(function () {
                var result = scope(function () {
                    assert(!disposed);
                    var value = new Tester(dispose);
                    assert(!disposed);
                    return value;
                });
                assert(!disposed);
                return result;
            });
            assert(!disposed);
        });

        it('should propagate array to parent scope', function () {
            var disposed = false;
            var dispose = function dispose() {
                return disposed = true;
            };
            scope(function () {
                scope(function () {
                    assert(!disposed);
                    var value = new Tester(dispose);
                    assert(!disposed);
                    return [value];
                });
                assert(!disposed);
            });
            assert(disposed);
        });

        it('should propagate object to parent scope', function () {
            var disposed = false;
            var dispose = function dispose() {
                return disposed = true;
            };
            scope(function () {
                scope(function () {
                    assert(!disposed);
                    var value = new Tester(dispose);
                    assert(!disposed);
                    return { value: value };
                });
                assert(!disposed);
            });
            assert(disposed);
        });

        it('should propagate array of objects to parent scope', function () {
            var disposed = false;
            var dispose = function dispose() {
                return disposed = true;
            };
            scope(function () {
                scope(function () {
                    assert(!disposed);
                    var value = new Tester(dispose);
                    assert(!disposed);
                    return [{ value: value }, { value: value }];
                });
                assert(!disposed);
            });
            assert(disposed);
        });
    });

    describe('async', function () {
        it('should propagate value to parent scope', function () {
            return doAsync(regeneratorRuntime.mark(function _callee3() {
                var disposed, dispose;
                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                    while (1) {
                        switch (_context3.prev = _context3.next) {
                            case 0:
                                disposed = false;

                                dispose = function dispose() {
                                    return disposed = true;
                                };

                                _context3.next = 4;
                                return scope.async(regeneratorRuntime.mark(function _callee2() {
                                    return regeneratorRuntime.wrap(function _callee2$(_context2) {
                                        while (1) {
                                            switch (_context2.prev = _context2.next) {
                                                case 0:
                                                    _context2.next = 2;
                                                    return scope.async(regeneratorRuntime.mark(function _callee() {
                                                        var value;
                                                        return regeneratorRuntime.wrap(function _callee$(_context) {
                                                            while (1) {
                                                                switch (_context.prev = _context.next) {
                                                                    case 0:
                                                                        assert(!disposed);
                                                                        value = new Tester(dispose);

                                                                        assert(!disposed);
                                                                        _context.next = 5;
                                                                        return Promise.delay(1);

                                                                    case 5:
                                                                        return _context.abrupt('return', value);

                                                                    case 6:
                                                                    case 'end':
                                                                        return _context.stop();
                                                                }
                                                            }
                                                        }, _callee, this);
                                                    }));

                                                case 2:
                                                    assert(!disposed);

                                                case 3:
                                                case 'end':
                                                    return _context2.stop();
                                            }
                                        }
                                    }, _callee2, this);
                                }));

                            case 4:
                                assert(disposed);

                            case 5:
                            case 'end':
                                return _context3.stop();
                        }
                    }
                }, _callee3, this);
            }));
        });
    });

    describe('dispose', function () {
        it('GC should call dispose method', function () {
            var counter = 0;
            var dispose = function dispose() {
                return counter++;
            };
            var value2 = void 0;
            var f = function f() {
                var value = new Tester(dispose);
                gc();
                assert(!counter);
                value2 = value;
                value2 = new Tester(dispose, 42);
                assert(!counter);
                gc();
            };
            var value3 = new Tester(dispose);

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
    });
});
//# sourceMappingURL=raii.js.map