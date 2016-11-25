/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

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
        const libPath = yield findLib();
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
        const libPath = yield findLib();
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

var findLib = async(function* () {
    let libPath;
    try {
        libPath = yield Library.find(path.join(__dirname, '..'), 'benchlib');
    }
    catch (err) {
        libPath = yield Library.find(path.join(__dirname, '../..'), 'benchlib');
    }
    return libPath;
});