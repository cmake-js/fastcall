'use strict';
var es5Support = require('../lib/es5Support');

if (!es5Support.fallbackToES5(exports, 'test')) {
    require('./suites/dynload');
    require('./suites/libraryTests');
    require('./suites/raii');
    require('./suites/refTypes');
}