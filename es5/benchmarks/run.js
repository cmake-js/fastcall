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
var nativeRun = require('./nativeRun');
var nativeModuleRun = require('./nativeModuleRun');
var fastcallRun = require('./fastcallRun');
var ffiRun = require('./ffiRun');
var imports = require('./imports');
var config = require('./config');

var run = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    _context.prev = 0;

                    if (!_.includes(config.tests, 'native')) {
                        _context.next = 5;
                        break;
                    }

                    console.log('--- Native ---');
                    _context.next = 5;
                    return nativeRun();

                case 5:
                    if (!_.includes(config.tests, 'native-module')) {
                        _context.next = 9;
                        break;
                    }

                    console.log('\n--- Native Module ---');
                    _context.next = 9;
                    return nativeModuleRun();

                case 9:
                    if (!_.includes(config.tests, 'ffi')) {
                        _context.next = 13;
                        break;
                    }

                    console.log('\n--- (node-)ffi ---');
                    _context.next = 13;
                    return ffiRun();

                case 13:
                    if (!_.includes(config.tests, 'fastcall')) {
                        _context.next = 17;
                        break;
                    }

                    console.log('\n--- fastcall ---');
                    _context.next = 17;
                    return fastcallRun();

                case 17:
                    _context.prev = 17;

                    imports.importBenchlib.close();
                    process.exit(0);
                    return _context.finish(17);

                case 21:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this, [[0,, 17, 21]]);
}));

run();
//# sourceMappingURL=run.js.map