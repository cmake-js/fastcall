'use strict';
const bindings = require('bindings');

module.exports = function () {
    // Note: for the real LOC of this method, just take a llok at benchmod/benchmod.cpp.
    return bindings('benchmod');
};