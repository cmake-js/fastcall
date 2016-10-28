'use strict';

var es5Support = require('../lib/es5Support');

if (!es5Support.fallbackToES5(exports, 'benchmarks')) {
    require('./run');
}
//# sourceMappingURL=index.js.map
