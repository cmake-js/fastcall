'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const fastcall = require('../lib');
const Library = fastcall.Library;
const path = require('path');
const ffi = require('ffi');

let ffiLib = null;
let fastcallLib = null;

exports.ffiWay = async(function* () {
    if (ffiLib === null) {
        const libPath = yield Library.find(path.join(__dirname, '..'), 'benchlib');
        ffiLib = ffi.Library(
            libPath,
            {
                addNumbersExp: ['double', ['float', 'int']],
                concatExp: ['void', ['char*', 'char*', 'char*', 'uint']],
                makeIntExp: ['int', ['float', 'double', 'void*', 'void*']]
            });
        ffiLib.TMakeIntFunc = f => ffi.Callback('int', ['float', 'double', 'void*'], f);
    }
    return ffiLib;
});

exports.fastcallWay = async(function* () {
    if (fastcallLib === null) {
        const libPath = yield Library.find(path.join(__dirname, '..'), 'benchlib');
        fastcallLib = new Library(libPath)
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
    }
    return fastcallLib;
});

exports.close = function () {
    if (fastcallLib) {
        fastcallLib.release();
        fastcallLib = null;
    }
};