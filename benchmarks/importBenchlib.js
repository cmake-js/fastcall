'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const lib = require('../lib');
const Library = lib.Library;
const path = require('path');

module.exports = async(function* () {
    const libPath = yield Library.find(path.join(__dirname, '..'), 'benchlib');
    const lib = new Library(libPath)
    .callback('int TMakeIntFunc(float, double, void*)')
    .function('double measureNativeNumberSyncTest(uint iterations)')
    .function('double measureNativeStringSyncTest(uint iterations)')
    .function('double measureNativeCallbackSyncTest(uint iterations)')
    .function('double measureNativeNumberAsyncTest(uint iterations)')
    .function('double measureNativeStringAsyncTest(uint iterations)')
    .function('double measureNativeCallbackAsyncTest(uint iterations)')
    .function('double addNumbersExp(float floatValue, int intValue)')
    .function('void concatExp(char* str1, char* str2, char* result, uint resultSize)')
    .function('int makeIntExp(float floatValue, double doubleValue, TMakeIntFunc func, void* context)');
    return lib;
});