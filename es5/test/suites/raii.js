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

    function Tester() {
        _classCallCheck(this, Tester);

        return _possibleConstructorReturn(this, (Tester.__proto__ || Object.getPrototypeOf(Tester)).apply(this, arguments));
    }

    return Tester;
}(Disposable);

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

        it('should dispose explicitly', function () {
            var disposed1 = 0;
            var dispose1 = function dispose1() {
                return disposed1++;
            };
            var disposed2 = 0;
            var dispose2 = function dispose2() {
                return disposed2++;
            };
            scope(function () {
                var value = scope(function () {
                    assert(!disposed1);
                    assert(!disposed2);
                    var value = new Tester(dispose1);
                    assert(!disposed1);
                    assert(!disposed2);
                    return value;
                });
                assert(!disposed1);
                assert(!disposed2);
                value.dispose();
                assert.equal(disposed1, 1);
                assert(!disposed2);
                value.resetDisposable(dispose2);
                value.dispose();
                assert.equal(disposed1, 1);
                assert.equal(disposed2, 1);
            });
            assert.equal(disposed1, 1);
            assert.equal(disposed2, 1);
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

        it('should throw when disposeFunction is asynchronous', function () {
            var disposed = false;
            var dispose = function dispose() {
                return Promise.delay(1).then(function () {
                    return disposed = true;
                });
            };
            assert.throws(function () {
                scope(function () {
                    scope(function () {
                        assert(!disposed);
                        var value = new Tester(dispose);
                        assert(!disposed);
                        return [{ value: value }, { value: value }];
                    });
                    assert(!disposed);
                });
            });
        });
    });

    describe('async', function () {
        it('should propagate value to parent scope', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
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
                            return scope.async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                                    while (1) {
                                        switch (_context2.prev = _context2.next) {
                                            case 0:
                                                _context2.next = 2;
                                                return scope.async( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
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
        })));

        it('should support asynchronous dispose function', async( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
            var counter, dispose;
            return regeneratorRuntime.wrap(function _callee6$(_context6) {
                while (1) {
                    switch (_context6.prev = _context6.next) {
                        case 0:
                            counter = 0;

                            dispose = function dispose() {
                                return Promise.delay(10).then(function () {
                                    return counter++;
                                });
                            };

                            _context6.next = 4;
                            return scope.async( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
                                return regeneratorRuntime.wrap(function _callee5$(_context5) {
                                    while (1) {
                                        switch (_context5.prev = _context5.next) {
                                            case 0:
                                                _context5.next = 2;
                                                return scope.async( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                                                    var value1, value2;
                                                    return regeneratorRuntime.wrap(function _callee4$(_context4) {
                                                        while (1) {
                                                            switch (_context4.prev = _context4.next) {
                                                                case 0:
                                                                    assert(!counter);
                                                                    value1 = new Tester(dispose);
                                                                    value2 = new Tester(dispose);

                                                                    assert(!counter);
                                                                    _context4.next = 6;
                                                                    return Promise.delay(1);

                                                                case 6:
                                                                    return _context4.abrupt('return', value1);

                                                                case 7:
                                                                case 'end':
                                                                    return _context4.stop();
                                                            }
                                                        }
                                                    }, _callee4, this);
                                                }));

                                            case 2:
                                                assert.equal(counter, 1);

                                            case 3:
                                            case 'end':
                                                return _context5.stop();
                                        }
                                    }
                                }, _callee5, this);
                            }));

                        case 4:
                            assert.equal(counter, 2);

                        case 5:
                        case 'end':
                            return _context6.stop();
                    }
                }
            }, _callee6, this);
        })));
    });

    describe('dispose', function () {
        describe('GC', function () {
            it('should call dispose function', function () {
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

            it('should call all dispose functions after reset', function () {
                var counter = 0;
                var dispose1 = function dispose1() {
                    return counter++;
                };
                var dispose2 = function dispose2() {
                    return counter += 100;
                };
                var test = new Tester(dispose1, 10);
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
//# sourceMappingURL=raii.js.map