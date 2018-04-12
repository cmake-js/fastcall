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
var common = require('./common');

module.exports = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var lib;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.next = 2;
                    return imports.importBenchlib.fastcallWay();

                case 2:
                    lib = _context.sent;


                    if (_.includes(config.modes, 'sync')) {
                        console.log('--- sync ---');
                        syncRun(lib);
                    }
                    if (_.includes(config.modes, 'async')) {
                        console.log('--- async ---');
                        asyncRun(lib);
                    }

                case 5:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

function syncRun(lib) {
    var ms = lib.interface.measureNativeNumberSyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);

    ms = lib.interface.measureNativeStringSyncTest(config.iterations);
    common.showResult('concat', 1, ms);

    ms = lib.interface.measureNativeCallbackSyncTest(config.iterations);
    common.showResult('callback', 3, ms);
}

function asyncRun(lib) {
    var ms = lib.interface.measureNativeNumberAsyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);

    ms = lib.interface.measureNativeStringAsyncTest(config.iterations);
    common.showResult('concat', 1, ms);

    ms = lib.interface.measureNativeCallbackAsyncTest(config.iterations);
    common.showResult('callback', 3, ms);
}
//# sourceMappingURL=nativeRun.js.map