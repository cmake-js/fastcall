'use strict';
var es5Support = require('./es5Support');

if (!es5Support.fallbackToES5(exports, 'lib')) {
    exports.ref = require('./ref-libs/ref');
    exports.StructType = require('./ref-libs/struct');
    exports.UnionType = require('./ref-libs/union');
    exports.ArrayType = require('./ref-libs/array');
    exports.scope = require('./scope');
    exports.Scoped = require('./Scoped');
    exports.Library = require('./Library');
};