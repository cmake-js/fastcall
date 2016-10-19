'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const nativeRun = require('./nativeRun');
const nativeModuleRun = require('./nativeModuleRun');
const fastcallRun = require('./fastcallRun');
const ffiRun = require('./ffiRun');
const imports = require('./imports');

const run = async(function* () {
    try {
        // console.log('--- Native ---');
        // yield nativeRun();
        // console.log('\n--- Native Module ---');
        // yield nativeModuleRun();
        // console.log('\n--- (node-)ffi ---');
        // yield ffiRun();
        // console.log('\n--- fastcall ---');
        yield fastcallRun();
        // console.log('--- end ---');
    }
    finally {
        imports.importBenchlib.close();
    }
});

run();