'use strict';
var es5Support = require('./es5Support');

if (!es5Support.fallbackToES5(exports, 'lib')) {
    exports.ref = require('./TooTallNates/ref');
    exports.StructType = require('./TooTallNates/struct');
    exports.UnionType = require('./TooTallNates/union');
    exports.scope = require('./scope');
    exports.Scoped = require('./Scoped');
    exports.Library = require('./Library');
};