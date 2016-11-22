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
const Callback = require('./Callback');
const verify = require('../verify');
const a = verify.a;
const ert = verify.ert;

module.exports = Library;

function Library(path, def, options) {
    if (!(this instanceof Library)) {
        return new Library(path, def, options);
    }

    assert(_.isString(path), 'Argument "path" is not a string.');
    assert(_.isObject(def), 'Argument "def" is not an object.');

    this.options = Object.freeze(_.clone(options || {}));
    this._library = new FastcallLibrary(path);
    this._initInterface(def);
}

Library.prototype._initInterface = function (def) {
    _.each(def, (value, key) => {
        this._library.function({ [key]: value });
    });
    _.each(this._library.interface, (func, name) => {
        const pointerArgIndices = getPointerArgIndices(func);
        let newFunc;
        if (pointerArgIndices.length) {
            newFunc = (...args) => {
                this._callbacksToPointer(args, pointerArgIndices);
                return func(...args);
            };
            newFunc.asyncPromise = (...args) => {
                this._callbacksToPointer(args, pointerArgIndices);
                return func.async(...args);
            };
            newFunc.async = (...args) => {
                const callback = args[args.length - 1];
                args.length--;
                this._callbacksToPointer(args, pointerArgIndices);
                func.async(...args).asCallback(callback);
            };
        }
        else {
            newFunc = function () {
                return func(...arguments);
            };
            newFunc.asyncPromise = function () {
                return func.async(...arguments);
            };
            newFunc.async = function (...args) {
                const callback = args[args.length - 1];
                args.length--;
                func.async(...args).asCallback(callback);
            };
        }
        if (this.options.async) {
            const newAsyncFunc = newFunc.async;
            newAsyncFunc.asyncPromise = newFunc.asyncPromise;
            this[name] = newAsyncFunc;
        }
        else {
            this[name] = newFunc;
        }
    });

    function getPointerArgIndices(func) {
        const indices = [];
        if (func.function) {
            const args = func.function.args;
            a&&ert(_.isArray(args));
            for (let i = 0; i < args.length; i++) {
                const arg = args[i];
                a&&ert(_.isObject(arg.type));
                if (arg.type.indirection > 1) {
                    indices.push(i);
                }
            }
        }
        return indices;
    }
};

Library.prototype._callbacksToPointer = function (args, pointerArgIndices) {
    for (const i of pointerArgIndices) {
        const arg = args[i];
        if (arg instanceof Callback) {
            args[i] = arg._makePtr(this._library);
        }
    }
}

Library.prototype.release = function () {
    this._library.release();
}
