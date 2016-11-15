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
const assert = require('assert');
const common = require('./common');

module.exports = async(function* () {
    const lib = yield imports.importBenchlib.fastcallWay();

    console.log('--- sync ---');
    syncRun(lib);
    console.log('--- async ---');
    yield asyncRun(lib);
});

function syncRun(lib) {
    let result = 0;
    const addNumbers = lib.interface.addNumbersExp;
    common.measure('addNumbers', 3, () => {
        result = addNumbers(addNumbers(5.5, 5), addNumbers(1.1, 1));
    });
    assert.equal(result, 5.5 + 5 + 1 + 1);
}

var asyncRun = async(function* (lib) {
    let result = 0;
    const addNumbersAsync = lib.interface.addNumbersExp.async;
    yield common.measureAsync('addNumbers', 3, async(function* () {
        result = yield addNumbersAsync(yield addNumbersAsync(5.5, 5), yield addNumbersAsync(1.1, 1));
    }));
    assert.equal(result, 5.5 + 5 + 1 + 1);
});