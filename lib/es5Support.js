'use strict';
var _ = require('lodash');
var path = require('path');
var debug = require('debug')('fastcall:es5Support');

exports.fallbackToES5 = fallbackToES5;

var isESvSomethingSupported = true;
try {
    eval('const err = () => { throw new Error(`foo`); };const args = ["a", "return a"];new Function(...args)(1) === 1||err();');
    debug('running in ES2015 mode');
}
catch (err) {
    isESvSomethingSupported = false;
    debug('falling back to ES5');
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