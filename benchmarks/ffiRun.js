'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const imports = require('./imports');
const config = require('./config.json');
const assert = require('assert');
const common = require('./common');

module.exports = async(function* () {
    const lib = yield imports.importBenchlib.ffiWay();

    console.log('--- sync ---');
    syncRun(lib);
    // console.log('--- async ---');
    // yield asyncRun(lib);
});

function syncRun(lib) {
    let result = 0;
    common.measure('addNumbers', () => {
        result = lib.addNumbersExp(lib.addNumbersExp(5.5, 5), lib.addNumbersExp(1.1, 1));
    });
    assert(result === 5.5 + 5 + 1 + 1);
}

var asyncRun = async(function* (lib) {
    let result = 0;
    const addNumbersAsync =  Promise.promisify(lib.addNumbersExp.async);
    yield common.measureAsync('addNumbers', async(function* () {
        result = yield addNumbersAsync(yield addNumbersAsync(5.5, 5), yield addNumbersAsync(1.1, 1));
    }));
    assert(result === 5.5 + 5 + 1 + 1);
});