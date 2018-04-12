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

var _ = require('lodash');
var Promise = require('bluebird');
var async = Promise.coroutine;
var imports = require('./imports');
var config = require('./config');
var assert = require('assert');
var common = require('./common');

module.exports = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var module;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    module = imports.importBenchmod();


                    if (_.includes(config.modes, 'sync')) {
                        console.log('--- sync ---');
                        syncRun(module);
                    }

                    if (!_.includes(config.modes, 'async')) {
                        _context.next = 6;
                        break;
                    }

                    console.log('--- async ---');
                    _context.next = 6;
                    return asyncRun(module);

                case 6:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

function syncRun(module) {
    var result = void 0;

    var addNumbers = module.addNumbers;
    common.measure('addNumbers', 3, function () {
        result = addNumbers(addNumbers(5.5, 5), addNumbers(1.1, 1));
    });
    assert.equal(result, 5.5 + 5 + 1 + 1);

    var concat = module.concat;
    common.measure('concat', 1, function () {
        result = concat("Hello,", " world!");
    });
    assert.equal(result, "Hello, world!");

    var cb = function cb(a, b) {
        return a + b;
    };
    var makeInt = module.makeInt;
    common.measure('callback', 3, function () {
        result = makeInt(makeInt(5.5, 5.1, cb), makeInt(1.1, 1.8, cb), cb);
    });
    assert.equal(result, 5 + 5 + 1 + 1);
}

var asyncRun = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(module) {
    var result, addNumbersAsync, concatAsync, cb, makeIntAsync;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
            switch (_context5.prev = _context5.next) {
                case 0:
                    result = void 0;
                    addNumbersAsync = Promise.promisify(module.addNumbersAsync);
                    _context5.next = 4;
                    return common.measureAsync('addNumbers', 3, async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
                        return regeneratorRuntime.wrap(function _callee2$(_context2) {
                            while (1) {
                                switch (_context2.prev = _context2.next) {
                                    case 0:
                                        _context2.t0 = addNumbersAsync;
                                        _context2.next = 3;
                                        return addNumbersAsync(5.5, 5);

                                    case 3:
                                        _context2.t1 = _context2.sent;
                                        _context2.next = 6;
                                        return addNumbersAsync(1.1, 1);

                                    case 6:
                                        _context2.t2 = _context2.sent;
                                        _context2.next = 9;
                                        return (0, _context2.t0)(_context2.t1, _context2.t2);

                                    case 9:
                                        result = _context2.sent;

                                    case 10:
                                    case 'end':
                                        return _context2.stop();
                                }
                            }
                        }, _callee2, this);
                    })));

                case 4:
                    assert.equal(result, 5.5 + 5 + 1 + 1);

                    concatAsync = Promise.promisify(module.concatAsync);
                    _context5.next = 8;
                    return common.measureAsync('concat', 1, async( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
                        return regeneratorRuntime.wrap(function _callee3$(_context3) {
                            while (1) {
                                switch (_context3.prev = _context3.next) {
                                    case 0:
                                        _context3.next = 2;
                                        return concatAsync("Hello,", " world!");

                                    case 2:
                                        result = _context3.sent;

                                    case 3:
                                    case 'end':
                                        return _context3.stop();
                                }
                            }
                        }, _callee3, this);
                    })));

                case 8:
                    assert.equal(result, "Hello, world!");

                    cb = function cb(a, b) {
                        return a + b;
                    };

                    makeIntAsync = Promise.promisify(module.makeIntAsync);
                    _context5.next = 13;
                    return common.measureAsync('callback', 3, async( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
                        return regeneratorRuntime.wrap(function _callee4$(_context4) {
                            while (1) {
                                switch (_context4.prev = _context4.next) {
                                    case 0:
                                        _context4.t0 = makeIntAsync;
                                        _context4.next = 3;
                                        return makeIntAsync(5.5, 5.1, cb);

                                    case 3:
                                        _context4.t1 = _context4.sent;
                                        _context4.next = 6;
                                        return makeIntAsync(1.1, 1.8, cb);

                                    case 6:
                                        _context4.t2 = _context4.sent;
                                        _context4.t3 = cb;
                                        _context4.next = 10;
                                        return (0, _context4.t0)(_context4.t1, _context4.t2, _context4.t3);

                                    case 10:
                                        result = _context4.sent;

                                    case 11:
                                    case 'end':
                                        return _context4.stop();
                                }
                            }
                        }, _callee4, this);
                    })));

                case 13:
                    assert.equal(result, 5 + 5 + 1 + 1);

                case 14:
                case 'end':
                    return _context5.stop();
            }
        }
    }, _callee5, this);
}));
//# sourceMappingURL=nativeModuleRun.js.map