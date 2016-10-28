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
    const ms = lib.interface.measureNativeNumberSyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);
}

function asyncRun(lib) {
    const ms = lib.interface.measureNativeNumberAsyncTest(config.iterations);
    common.showResult('addNumbers', 3, ms);
}