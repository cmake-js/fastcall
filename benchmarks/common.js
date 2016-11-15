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
const config = require('./config');
const Promise = require('bluebird');
const async = Promise.coroutine;

const common = exports;

common.showResult = function (name, callsPerIteration, ms) {
    const perCallMs = ms / (getIterations() * callsPerIteration);
    console.log('%s - total: %s ms, call: %s ms',
        name,
        ms.toFixed(10),
        perCallMs.toFixed(10));
};

common.measure = function (name, callsPerIteration, f) {
    const iterations = getIterations();
    const begin = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        f();
    }
    common.showResult(name, callsPerIteration, toMs(process.hrtime(begin)));
};

common.measureAsync = async(function* (name, callsPerIteration, f) {
    const iterations = getIterations();
    const begin = process.hrtime();
    for (let i = 0; i < iterations; i++) {
        yield f();
    }
    common.showResult(name, callsPerIteration, toMs(process.hrtime(begin)));
});

function toMs(t) {
    return t[0] * 1000 + t[1] / 1000000;
}

function getIterations() {
    return config.iterations;
}