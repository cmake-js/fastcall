'use strict';
const os = require('os');
const assert = require('assert');
const int64Buffer = require('int64-buffer');
const Int64 = int64Buffer['Int64' + os.endianness()];
const Uint64 = int64Buffer['Uint64' + os.endianness()];

assert(Int64);
assert(Uint64);

exports.makeInt64 = function (hi, lo) {
    return new Int64(hi, lo);
}

exports.makeUint64 = function (hi, lo) {
    return new Uint64(hi, lo);
}

exports.makeNumber = function (value) {
    if (value instanceof Int64 || value instanceof Uint64) {
        return value.toBuffer();
    }
    return Number(value);
}