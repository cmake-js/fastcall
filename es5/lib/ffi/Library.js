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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

var _ = require('lodash');
var assert = require('assert');
var FastcallLibrary = require('../Library');
var Callback = require('./Callback');
var verify = require('../verify');
var a = verify.a;
var ert = verify.ert;

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
    var _this = this;

    _.each(def, function (value, key) {
        _this._library.function(_defineProperty({}, key, value));
    });
    _.each(this._library.interface, function (func, name) {
        var pointerArgIndices = getPointerArgIndices(func);
        var newFunc = void 0;
        if (pointerArgIndices.length) {
            newFunc = function newFunc() {
                for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
                    args[_key] = arguments[_key];
                }

                _this._callbacksToPointer(args, pointerArgIndices);
                return func.apply(undefined, args);
            };
            newFunc.asyncPromise = function () {
                for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
                    args[_key2] = arguments[_key2];
                }

                _this._callbacksToPointer(args, pointerArgIndices);
                return func.async.apply(func, args);
            };
            newFunc.async = function () {
                for (var _len3 = arguments.length, args = Array(_len3), _key3 = 0; _key3 < _len3; _key3++) {
                    args[_key3] = arguments[_key3];
                }

                var callback = args[args.length - 1];
                args.length--;
                _this._callbacksToPointer(args, pointerArgIndices);
                func.async.apply(func, args).asCallback(callback);
            };
        } else {
            newFunc = function newFunc() {
                return func.apply(undefined, arguments);
            };
            newFunc.asyncPromise = function () {
                return func.async.apply(func, arguments);
            };
            newFunc.async = function () {
                for (var _len4 = arguments.length, args = Array(_len4), _key4 = 0; _key4 < _len4; _key4++) {
                    args[_key4] = arguments[_key4];
                }

                var callback = args[args.length - 1];
                args.length--;
                func.async.apply(func, args).asCallback(callback);
            };
        }
        if (_this.options.async) {
            var newAsyncFunc = newFunc.async;
            newAsyncFunc.asyncPromise = newFunc.asyncPromise;
            _this[name] = newAsyncFunc;
        } else {
            _this[name] = newFunc;
        }
    });

    function getPointerArgIndices(func) {
        var indices = [];
        if (func.function) {
            var args = func.function.args;
            a && ert(_.isArray(args));
            for (var i = 0; i < args.length; i++) {
                var arg = args[i];
                a && ert(_.isObject(arg.type));
                if (arg.type.indirection > 1) {
                    indices.push(i);
                }
            }
        }
        return indices;
    }
};

Library.prototype._callbacksToPointer = function (args, pointerArgIndices) {
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = pointerArgIndices[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var i = _step.value;

            var arg = args[i];
            if (arg instanceof Callback) {
                args[i] = arg._makePtr(this._library);
            }
        }
    } catch (err) {
        _didIteratorError = true;
        _iteratorError = err;
    } finally {
        try {
            if (!_iteratorNormalCompletion && _iterator.return) {
                _iterator.return();
            }
        } finally {
            if (_didIteratorError) {
                throw _iteratorError;
            }
        }
    }
};

Library.prototype.release = function () {
    this._library.release();
};
//# sourceMappingURL=Library.js.map