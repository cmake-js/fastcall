/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';
var _ = require('lodash');
var path = require('path');
var debug = require('debug')('fastcall:es5Support');
var args = require('minimist')(process.argv.slice(2));

exports.fallbackToES5 = fallbackToES5;

var isESvSomethingSupported = true;
if (args['fastcall-es5-fallback']) {
    isESvSomethingSupported = false;
    debug('falling back to ES5 due "--fastcall-es5-fallback"');
}
else {
    try {
        eval('const err = () => { throw new Error(`foo`); };const args = ["a", "return a"];new Function(...args)(1) === 1||err();');
        eval('function Poo (a = 1) {}');
        debug('running in ES2015 mode');
    }
    catch (err) {
        isESvSomethingSupported = false;
        debug('falling back to ES5');
    }
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