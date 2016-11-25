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
const Promise = require('bluebird');
const async = Promise.coroutine;
const imports = require('./imports');
const config = require('./config');
const common = require('./common');

module.exports = async(function* () {
    const lib = yield imports.importBenchlib.fastcallWay();

    console.log('--- sync ---');
    syncRun(lib);
    console.log('--- async ---');
    asyncRun(lib);
});

function syncRun(lib) {
    let ms = lib.interface.measureNativeNumberSyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);

    ms = lib.interface.measureNativeStringSyncTest(config.iterations);
    common.showResult('concat', 1, ms);

    ms = lib.interface.measureNativeCallbackSyncTest(config.iterations);
    common.showResult('callback', 3, ms);
}

function asyncRun(lib) {
    let ms = lib.interface.measureNativeNumberAsyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);

    ms = lib.interface.measureNativeStringAsyncTest(config.iterations);
    common.showResult('concat', 1, ms);

    ms = lib.interface.measureNativeCallbackAsyncTest(config.iterations);
    common.showResult('callback', 3, ms);
}