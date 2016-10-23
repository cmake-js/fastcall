'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const imports = require('./imports');
const config = require('./config.json');
const assert = require('assert');
const common = require('./common');

module.exports = async(function* () {
    const lib = yield imports.importBenchlib.fastcallWay();

    console.log('--- sync ---');
    syncRun(lib);
    // console.log('--- async ---');
    // yield asyncRun(lib);
    // console.log('--- async (wired) ---');
    // yield asyncWiredRun(lib);
});

function syncRun(lib) {
    let result = 0;
    common.measure('addNumbers', () => {
        result = lib.interface.addNumbersExp(lib.interface.addNumbersExp(5.5, 5), lib.interface.addNumbersExp(1.1, 1));
    });
    assert.equal(result, 5.5 + 5 + 1 + 1);
}

var asyncRun = async(function* (lib) {
    let result = 0;
    const addNumbersAsync = lib.functions.addNumbersExp.async();
    yield common.measureAsync('addNumbers', async(function* () {
        result = yield addNumbersAsync(yield addNumbersAsync(5.5, 5).get(), yield addNumbersAsync(1.1, 1).get()).get();
    }));
    //assert.equal(result, 5.5 + 5 + 1 + 1);
});

var asyncWiredRun = async(function* (lib) {
    let result = 0;
    const addNumbersAsync = lib.functions.addNumbersExp.async();
    yield common.measureAsync('addNumbers', async(function* () {
        result = yield addNumbersAsync(addNumbersAsync(5.5, 5), addNumbersAsync(1.1, 1)).get();
    }));
    //assert.equal(result, 5.5 + 5 + 1 + 1);
});