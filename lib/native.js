'use strict';

module.exports = require('bindings')('fastcall');
module.exports.require = require;
module.exports.AsyncResult = require('./AsyncResult');