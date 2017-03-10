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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var a = verify.a;
var ert = verify.ert;
var native = require('./native');
var util = require('util');
var FunctionDefinition = require('./FunctionDefinition');
var ref = require('./ref-libs/ref');

var FastCallback = function (_FunctionDefinition) {
    _inherits(FastCallback, _FunctionDefinition);

    function FastCallback(library, def) {
        _classCallCheck(this, FastCallback);

        assert(_.isObject(library), '"library" is not an object.');

        var _this = _possibleConstructorReturn(this, (FastCallback.__proto__ || Object.getPrototypeOf(FastCallback)).call(this, library, def));

        _this.library = library;
        _this._def = new FunctionDefinition(library, def);
        _this._processArgs = null;
        _this._setResult = null;
        _this._type.callback = _this;
        return _this;
    }

    _createClass(FastCallback, [{
        key: 'initialize',
        value: function initialize() {
            this._execute = this._makeExecuteMethod();
        }
    }, {
        key: 'getFactory',
        value: function getFactory() {
            var _this2 = this;

            var factory = function factory(value) {
                return _this2.makePtr(value);
            };
            factory.callback = this;
            factory.type = this.type;
            return factory;
        }
    }, {
        key: 'makePtr',
        value: function makePtr(value) {
            if (value) {
                if (value.callback === this) {
                    return value;
                }
                if (_.isFunction(value)) {
                    var ptr = native.callback.makePtr(this, this.library._loop, this.signature, this.execute, value);
                    a && ert(ptr.callback === this);
                    ptr.type = this.type;
                    return ptr;
                }
                if (value instanceof Buffer) {
                    if (value.type === undefined) {
                        value.type = this.type;
                    }
                    if (value.callback === undefined) {
                        value.callback = this;
                    }
                    if (value.callback === this) {
                        return value;
                    }
                    throw new TypeError('Buffer is not a callback pointer.');
                }
            } else if (value === null) {
                return null;
            }
            throw new TypeError('Cannot make callback from: ' + value);
        }
    }, {
        key: '_makeExecuteMethod',
        value: function _makeExecuteMethod() {
            var processArgsFunc = this._makeProcessArgsFunc();
            var resultTypeCode = this.resultType.code;
            var callArgs = new Array(this.args.length);
            if (resultTypeCode !== 'v') {
                var setResultFunc = this._findSetResultFunc();
                return function (argsPtr, resultPtr, func) {
                    processArgsFunc(argsPtr, callArgs);
                    var result = func.apply(undefined, callArgs);
                    setResultFunc(resultPtr, result);
                };
            }
            return function (argsPtr, resultPtr, func) {
                processArgsFunc(argsPtr, callArgs);
                func.apply(undefined, callArgs);
            };
        }
    }, {
        key: '_makeProcessArgsFunc',
        value: function _makeProcessArgsFunc() {
            var _this3 = this;

            var processArgFuncs = this.args.map(function (arg) {
                return _this3._findProcessArgFunc(arg.type);
            });
            var funcArgs = ['argsPtr', 'callArgs'];
            var funcBody = '';
            for (var i = 0; i < processArgFuncs.length; i++) {
                funcBody += 'callArgs[' + i + '] = this.processArgFunc' + i + '(argsPtr);';
            }

            var Ctx = function Ctx(callback) {
                _classCallCheck(this, Ctx);

                var i = 0;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    for (var _iterator = processArgFuncs[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var processArgFunc = _step.value;

                        this['processArgFunc' + i++] = processArgFunc.func;
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

            var ctx = new Ctx(this);

            var innerFunc = void 0;
            try {
                innerFunc = new (Function.prototype.bind.apply(Function, [null].concat(_toConsumableArray(funcArgs.concat([funcBody])))))();
            } catch (err) {
                throw Error('Invalid function body: ' + funcBody);
            }

            var func = function func() {
                return innerFunc.apply(ctx, arguments);
            };
            func.callback = this;
            return func;
        }
    }, {
        key: '_findProcessArgFunc',
        value: function _findProcessArgFunc(type) {
            return this.findFastcallFunc(native.callback, 'arg', type);
        }
    }, {
        key: '_findSetResultFunc',
        value: function _findSetResultFunc() {
            return this.findFastcallFunc(native.callback, 'set', this.resultType).func;
        }
    }, {
        key: 'execute',
        get: function get() {
            assert(this._execute, 'FastCallback is not initialized.');
            return this._execute;
        }
    }]);

    return FastCallback;
}(FunctionDefinition);

module.exports = FastCallback;
//# sourceMappingURL=FastCallback.js.map