'use strict';

var es5Support = require('./es5Support');

if (!es5Support.fallbackToES5(exports, 'lib')) {
    exports.ref = require('./ref');
    exports.scope = require('./scope');
    exports.Scoped = require('./Scoped');
    exports.Library = require('./Library');
};
//# sourceMappingURL=index.js.map
