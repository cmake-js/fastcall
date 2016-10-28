'use strict';

var _ = require('lodash');
var path = require('path');

exports.fallbackToES5 = fallbackToES5;

var isESvSomethingSupported = true;
try {
    eval('const err = () => throw new Error(`foo`);const args = ["a", "a"];new Function(...args)(1) === 1||err();');
} catch (err) {
    isESvSomethingSupported = false;
}

var isES5VersionBranch = _.endsWith(__dirname, 'es5' + path.sep + 'lib');

function fallbackToES5(exports, _path) {
    if (isESvSomethingSupported || isES5VersionBranch) {
        return false;
    }

    require('babel-polyfill');
    _.extend(exports || {}, require('../es5/' + _path) || {});
    return true;
}
//# sourceMappingURL=es5Support.js.map
