'use strict';

var Promise = require('bluebird');
var async = Promise.coroutine;
var imports = require('./imports');
var config = require('./config');
var assert = require('assert');
var common = require('./common');

module.exports = async(regeneratorRuntime.mark(function _callee() {
    var lib;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.next = 2;
                    return imports.importBenchlib.ffiWay();

                case 2:
                    lib = _context.sent;


                    console.log('--- sync ---');
                    syncRun(lib);
                    console.log('--- async ---');
                    _context.next = 8;
                    return asyncRun(lib);

                case 8:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

function syncRun(lib) {
    var result = 0;
    common.measure('addNumbers', 3, function () {
        result = lib.addNumbersExp(lib.addNumbersExp(5.5, 5), lib.addNumbersExp(1.1, 1));
    });
    assert(result === 5.5 + 5 + 1 + 1);
}

var asyncRun = async(regeneratorRuntime.mark(function _callee3(lib) {
    var result, addNumbersAsync;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
            switch (_context3.prev = _context3.next) {
                case 0:
                    result = 0;
                    addNumbersAsync = Promise.promisify(lib.addNumbersExp.async);
                    _context3.next = 4;
                    return common.measureAsync('addNumbers', 3, async(regeneratorRuntime.mark(function _callee2() {
                        return regeneratorRuntime.wrap(function _callee2$(_context2) {
                            while (1) {
                                switch (_context2.prev = _context2.next) {
                                    case 0:
                                        _context2.next = 2;
                                        return addNumbersAsync(5.5, 5);

                                    case 2:
                                        _context2.t0 = _context2.sent;
                                        _context2.next = 5;
                                        return addNumbersAsync(1.1, 1);

                                    case 5:
                                        _context2.t1 = _context2.sent;
                                        _context2.next = 8;
                                        return addNumbersAsync(_context2.t0, _context2.t1);

                                    case 8:
                                        result = _context2.sent;

                                    case 9:
                                    case 'end':
                                        return _context2.stop();
                                }
                            }
                        }, _callee2, this);
                    })));

                case 4:
                    assert(result === 5.5 + 5 + 1 + 1);

                case 5:
                case 'end':
                    return _context3.stop();
            }
        }
    }, _callee3, this);
}));
//# sourceMappingURL=ffiRun.js.map
