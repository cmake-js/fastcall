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

common.measureAsync = async(regeneratorRuntime.mark(function _callee(name, callsPerIteration, f) {
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