'use strict';
const importBenchlib = require('./importBenchlib');
const importBenchmod = require('./importBenchmod');
const Promise = require('bluebird');

exports.importBenchlib = Promise.method(importBenchlib);
exports.importBenchmod = Promise.method(importBenchmod);