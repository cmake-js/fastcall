'use strict';

var Promise = require('bluebird');
var async = Promise.coroutine;
var nativeRun = require('./nativeRun');
var nativeModuleRun = require('./nativeModuleRun');
var fastcallRun = require('./fastcallRun');
var ffiRun = require('./ffiRun');
var imports = require('./imports');

var run = async(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.prev = 0;

                    console.log('--- Native ---');
                    _context.next = 4;
                    return nativeRun();

                case 4:
                    console.log('\n--- Native Module ---');
                    _context.next = 7;
                    return nativeModuleRun();

                case 7:
                    console.log('\n--- (node-)ffi ---');
                    _context.next = 10;
                    return ffiRun();

                case 10:
                    console.log('\n--- fastcall ---');
                    _context.next = 13;
                    return fastcallRun();

                case 13:
                    _context.prev = 13;

                    imports.importBenchlib.close();
                    return _context.finish(13);

                case 16:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this, [[0,, 13, 16]]);
}));

run();
//# sourceMappingURL=run.js.map