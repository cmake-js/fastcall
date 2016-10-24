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
    console.log('--- async ---');
    yield asyncRun(lib);
});

function syncRun(lib) {
    let result = 0;
    const addNumbers = lib.interface.addNumbersExp;
    common.measure('addNumbers', () => {
        result = addNumbers(addNumbers(5.5, 5), addNumbers(1.1, 1));
    });
    assert.equal(result, 5.5 + 5 + 1 + 1);
}

var asyncRun = async(function* (lib) {
    let result = 0;
    const addNumbersAsync = lib.functions.addNumbersExp.async();
    yield common.measureAsync('addNumbers', async(function* () {
        result = yield addNumbersAsync(yield addNumbersAsync(5.5, 5), yield addNumbersAsync(1.1, 1));
    }));
    assert.equal(result, 5.5 + 5 + 1 + 1);
});