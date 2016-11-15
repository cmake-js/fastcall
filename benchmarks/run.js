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
const nativeRun = require('./nativeRun');
const nativeModuleRun = require('./nativeModuleRun');
const fastcallRun = require('./fastcallRun');
const ffiRun = require('./ffiRun');
const imports = require('./imports');

const run = async(function* () {
    try {
        console.log('--- Native ---');
        yield nativeRun();
        console.log('\n--- Native Module ---');
        yield nativeModuleRun();
        console.log('\n--- (node-)ffi ---');
        yield ffiRun();
        console.log('\n--- fastcall ---');
        yield fastcallRun();
    }
    finally {
        imports.importBenchlib.close();
    }
});

run();