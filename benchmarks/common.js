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