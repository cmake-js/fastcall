'use strict';

var es5Support = require('../lib/es5Support');

if (!es5Support.fallbackToES5(exports, 'test')) {
    require('./suites/dynload');
    require('./suites/smokeTests');
    require('./suites/raii');
    require('./suites/refTypes');
    require('./suites/synchModes');
}
//# sourceMappingURL=index.js.map