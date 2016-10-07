'use strict';
const assert = require('assert');
const _ = require('lodash');

const prod = process.env.NODE_ENV === 'production';

module.exports = prod ? _.noop : verify;
module.exports.enabled = !prod;

function verify(expr, message, arg0, arg1, arg2, arg3, arg4, arg5) {
    assert(expr, message, arg0, arg1, arg2, arg3, arg4, arg5);
}