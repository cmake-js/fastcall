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
const _ = require('lodash');
const assert = require('assert');
const FastcallLibrary = require('../Library');

module.exports = Library;

function Library(path, def) {
    if (!(this instanceof Library)) {
        return new Library(path, def);
    }

    assert(_.isString(path), 'Argument "path" is not a string.');
    assert(_.isObject(def), 'Argument "def" is not an object.');

    this._library = new FastcallLibrary(path);
    this._initInterface(def);
}

Library.prototype._initInterface = function (def) {
    _.each(def, (value, key) => {
        this._library.function({ [key]: value });
    });
    _.each(this._library.interface, (func, name) => {
        const newFunc = function () {
            return func(...arguments);
        };
        newFunc.asyncPromise = func.async;
        newFunc.async = function (...args) {
            assert(args.length > 0, 'Arguments expected.');
            func.async(args.slice(0, args.length - 1)).asCallback(args[args.length - 1]);
        };
        this[name] = newFunc;
    });
};

Library.prototype.release = function () {
    this._library.release();
}
