'use strict';

module.exports = require('bindings')('fastcall');
module.exports.require = require;
module.exports.int64 = require('./int64');