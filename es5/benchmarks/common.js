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

var config = require('./config');
var Promise = require('bluebird');
var async = Promise.coroutine;

var common = exports;

common.showResult = function (name, callsPerIteration, ms) {
    var perCallMs = ms / (getIterations() * callsPerIteration);
    console.log('%s - total: %s ms, call: %s ms', name, ms.toFixed(10), perCallMs.toFixed(10));
};

common.measure = function (name, callsPerIteration, f) {
    var iterations = getIterations();
    var begin = process.hrtime();
    for (var i = 0; i < iterations; i++) {
        f();
    }
    common.showResult(name, callsPerIteration, toMs(process.hrtime(begin)));
};

common.measureAsync = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee(name, callsPerIteration, f) {
    var iterations, begin, i;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    iterations = getIterations();
                    begin = process.hrtime();
                    i = 0;

                case 3:
                    if (!(i < iterations)) {
                        _context.next = 9;
                        break;
                    }

                    _context.next = 6;
                    return f();

                case 6:
                    i++;
                    _context.next = 3;
                    break;

                case 9:
                    common.showResult(name, callsPerIteration, toMs(process.hrtime(begin)));

                case 10:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

function toMs(t) {
    return t[0] * 1000 + t[1] / 1000000;
}

function getIterations() {
    return config.iterations;
}
//# sourceMappingURL=common.js.map