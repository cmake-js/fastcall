'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const imports = require('./imports');
const config = require('./config.json');
const assert = require('assert');
const common = require('./common');

module.exports = async(function* () {
    const module = yield imports.importBenchmod();

    console.log('- sync -');
    syncRun(module);
    console.log('- async -');
    yield asyncRun(module);
});

function syncRun(module) {
    let result = 0;
    common.measure('addNumbers', () => {
        result = module.addNumbers(module.addNumbers(5.5, 5), module.addNumbers(1.1, 1));
    });
    assert(result === 5.5 + 5 + 1 + 1);
}

var asyncRun = async(function* (module) {
    let result = 0;
    const addNumbersAsync =  Promise.promisify(module.addNumbersAsync);
    yield common.measureAsync('addNumbers', async(function* () {
        result = yield addNumbersAsync(yield addNumbersAsync(5.5, 5), yield addNumbersAsync(1.1, 1));
    }));
    assert(result === 5.5 + 5 + 1 + 1);
});