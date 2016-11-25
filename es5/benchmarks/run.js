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

                    // console.log('--- Native ---');
                    // yield nativeRun();
                    // console.log('\n--- Native Module ---');
                    // yield nativeModuleRun();
                    // console.log('\n--- (node-)ffi ---');
                    // yield ffiRun();
                    console.log('\n--- fastcall ---');
                    _context.next = 4;
                    return fastcallRun();

                case 4:
                    _context.prev = 4;

                    imports.importBenchlib.close();
                    return _context.finish(4);

                case 7:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this, [[0,, 4, 7]]);
}));

run();
//# sourceMappingURL=run.js.map