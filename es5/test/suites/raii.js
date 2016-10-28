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
var Scoped = fastcall.Scoped;

var Disposable = function (_Scoped) {
    _inherits(Disposable, _Scoped);

    function Disposable(dispose) {
        _classCallCheck(this, Disposable);

        assert(_.isFunction(dispose));

        var _this = _possibleConstructorReturn(this, (Disposable.__proto__ || Object.getPrototypeOf(Disposable)).call(this));

        _this.dispose = dispose;
        return _this;
    }

    return Disposable;
}(Scoped);

function doAsync(f) {
    return async(f)();
}

describe('RAII scope', function () {
    describe('sync', function () {
        it('should propagate value to parent scope', function () {
            var disposed = false;
            var dispose = function dispose() {
                return disposed = true;
            };
            scope(function () {
                scope(function () {
                    assert(!disposed);
                    var value = new Disposable(dispose);
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
                    var value = new Disposable(dispose);
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
                    var value = new Disposable(dispose);
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
                    var value = new Disposable(dispose);
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
                    var value = new Disposable(dispose);
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
                                                                        value = new Disposable(dispose);

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
});
//# sourceMappingURL=raii.js.map
