'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const nativeRun = require('./nativeRun');
const nativeModuleRun = require('./nativeModuleRun');
const fastcallRun = require('./fastcallRun');

const run = async(function* () {
    console.log('--- Native ---');
    yield nativeRun();
    console.log('\n--- Native Module ---');
    yield nativeModuleRun();
    console.log('\n--- fastcall ---');
    yield fastcallRun();
});

run();