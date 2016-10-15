'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const imports = require('./imports');
const config = require('./config.json');

module.exports = async(function* () {
    const lib = yield imports.importBenchlib();

    console.log('- sync -');
    syncRun(lib);
    console.log('- async -');
    yield asyncRun(lib);
});

function syncRun(lib) {
}

var asyncRun = async(function* (lib) {
});