'use strict';

var Promise = require('bluebird');
var async = Promise.coroutine;
var imports = require('./imports');
var config = require('./config');
var common = require('./common');

module.exports = async(regeneratorRuntime.mark(function _callee() {
    var lib;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.next = 2;
                    return imports.importBenchlib.fastcallWay();

                case 2:
                    lib = _context.sent;


                    console.log('--- sync ---');
                    syncRun(lib);
                    console.log('--- async ---');
                    asyncRun(lib);

                case 7:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

function syncRun(lib) {
    var ms = lib.interface.measureNativeNumberSyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);
}

function asyncRun(lib) {
    var ms = lib.interface.measureNativeNumberAsyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);
}
//# sourceMappingURL=nativeRun.js.map
