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

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var assert = require('assert');
var Promise = require('bluebird');
var native = require('./native');
var dyncall = native.dyncall;
var dynload = native.dynload;
var defs = require('./defs');
var callMode = defs.callMode;
var FunctionDefinition = require('./FunctionDefinition');
var util = require('util');
var verify = require('./verify');
var a = verify.a;
var ert = verify.ert;
var ref = require('./ref-libs/ref');

var FastFunction = function (_FunctionDefinition) {
    _inherits(FastFunction, _FunctionDefinition);

    function FastFunction(library, def, callMode, ptr) {
        _classCallCheck(this, FastFunction);

        assert(_.isObject(library), '"library" is not an object.');
        assert(callMode === defs.callMode.sync || callMode === defs.callMode.async, '"callMode" is invalid: ' + callMode);

        var _this = _possibleConstructorReturn(this, (FastFunction.__proto__ || Object.getPrototypeOf(FastFunction)).call(this, library, def));

        _this.callMode = callMode;
        _this._ptr = ptr;
        _this._vm = null;
        _this._function = null;
        _this._other = null;
        _this._type.function = _this;
        return _this;
    }

    _createClass(FastFunction, [{
        key: 'initialize',
        value: function initialize() {
            if (!this._ptr) {
                this._ptr = dynload.findSymbol(this.library._pLib, this.name);
            }
            assert(this._ptr, 'Symbol "' + this.name + '" not found in library "' + this.library.path + '".');
            this._vm = dyncall.newCallVM(this.library.options.vmSize);
            this._function = this._makeFunction();
        }
    }, {
        key: 'release',
        value: function release() {
            dyncall.free(this._vm);
        }
    }, {
        key: 'getFunction',
        value: function getFunction() {
            assert(this._function, this.name + ' is not initialized.');
            return this._function;
        }
    }, {
        key: 'sync',
        value: function sync() {
            if (this.callMode === defs.callMode.sync) {
                return this.getFunction();
            }
            if (!this._other) {
                this._other = new FastFunction(this.library, this, defs.callMode.sync, this._ptr);
                this._other.initialize();
            }
            return this._other.getFunction();
        }
    }, {
        key: 'async',
        value: function async() {
            if (this.callMode === defs.callMode.async) {
                return this.getFunction();
            }
            if (!this._other) {
                this._other = new FastFunction(this.library, this, defs.callMode.async, this._ptr);
                this._other.initialize();
            }
            return this._other.getFunction();
        }
    }, {
        key: '_makeFunction',
        value: function _makeFunction() {
            if (this.callMode === defs.callMode.async) {
                return this._makeAsyncFunction();
            }
            return this._makeSyncFunction();
        }
    }, {
        key: '_makeSyncFunction',
        value: function _makeSyncFunction() {
            var _this2 = this;

            var vmArgSetters = this.args.map(function (arg) {
                return _this2._findVMSetterFunc(arg.type);
            });
            var funcArgs = _.range(vmArgSetters.length).map(function (n) {
                return 'arg' + n;
            });
            var funcBody = 'this.setVM(this.vm);';
            for (var i = 0; i < vmArgSetters.length; i++) {
                funcBody += 'this.argSetter' + i + '(arg' + i + ');';
            }
            if (this.library.synchronized) {
                funcBody += 'this.library._lock();';
                funcBody += 'try {';
                funcBody += 'return this.callerFunc();';
                funcBody += '}';
                funcBody += 'finally {';
                funcBody += 'this.library._unlock();';
                funcBody += '}';
            } else {
                if (this.library.queued) {
                    funcBody += 'this.library._assertQueueEmpty();';
                }
                funcBody += 'return this.callerFunc();';
            }

            var Ctx = function Ctx(fn) {
                var _this3 = this;

                _classCallCheck(this, Ctx);

                this.library = fn.library;
                this.vm = fn._vm;
                this.setVM = dyncall.setVMAndReset;
                var i = 0;
                var _iteratorNormalCompletion = true;
                var _didIteratorError = false;
                var _iteratorError = undefined;

                try {
                    var _loop = function _loop() {
                        var setter = _step.value;

                        if (setter.type.indirection === 2) {
                            var _ret2 = function () {
                                var specPtrDef = setter.type.callback || setter.type.struct || setter.type.union || setter.type.array;
                                if (specPtrDef) {
                                    _this3['argSetter' + i++] = function (cb) {
                                        return setter.func(specPtrDef.makePtr(cb));
                                    };
                                    return {
                                        v: 'continue'
                                    };
                                }
                            }();

                            if ((typeof _ret2 === 'undefined' ? 'undefined' : _typeof(_ret2)) === "object") return _ret2.v;
                        }
                        _this3['argSetter' + i++] = setter.func;
                    };

                    for (var _iterator = vmArgSetters[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                        var _ret = _loop();

                        if (_ret === 'continue') continue;
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

                this.callerFunc = fn._makeCallerFunc();
            };

            var innerFunc = void 0;
            try {
                var innerFuncArgs = funcArgs.concat([funcBody]);
                innerFunc = new (Function.prototype.bind.apply(Function, [null].concat(_toConsumableArray(innerFuncArgs))))();
            } catch (err) {
                throw Error('Invalid function body: ' + funcBody);
            }
            var ctx = new Ctx(this);
            var func = function func() {
                return innerFunc.apply(ctx, arguments);
            };
            return this._initFunction(func);
        }
    }, {
        key: '_makeAsyncFunction',
        value: function _makeAsyncFunction() {
            var _this4 = this;

            var vmArgSetters = this.args.map(function (arg) {
                return _this4._findVMSetterFunc(arg.type);
            });
            var hasPtrArg = Boolean(_(vmArgSetters).filter(function (setter) {
                return setter.type.indirection > 1;
            }).head());
            var funcArgs = _.range(vmArgSetters.length).map(function (n) {
                return 'arg' + n;
            });
            var funcBody = hasPtrArg ? 'var ptrs = [];' : '';
            funcBody += 'var myVM = this.vm;';
            funcBody += 'this.setVM(myVM);';
            for (var i = 0; i < vmArgSetters.length; i++) {
                var _setter = vmArgSetters[i];
                if (_setter.type.indirection > 1) {
                    funcBody += 'this.argSetter' + i + '(arg' + i + ', ptrs);';
                } else {
                    funcBody += 'this.argSetter' + i + '(arg' + i + ');';
                }
            }

            var finallyCode = '{';
            if (this.library.synchronized) {
                finallyCode += 'this.library._unlock();';
                funcBody += 'this.library._lock();';
            }
            if (hasPtrArg) {
                finallyCode += 'ptrs = null;';
            }
            finallyCode += '}';

            var f = 'return this.callerFunc(myVM).finally(() => ' + finallyCode + ');';
            if (this.library.queued) {
                funcBody += 'return this.library._enqueue(() => { ' + f + ' });';
            } else {
                funcBody += f;
            }

            var Ctx = function Ctx(fn) {
                var _this5 = this;

                _classCallCheck(this, Ctx);

                this.library = fn.library;
                this.setVM = dyncall.setVM;
                this.free = dyncall.free;
                var i = 0;
                var _iteratorNormalCompletion2 = true;
                var _didIteratorError2 = false;
                var _iteratorError2 = undefined;

                try {
                    var _loop2 = function _loop2() {
                        var setter = _step2.value;

                        if (setter.type.indirection > 1) {
                            _this5['argSetter' + i++] = function (ptr, ptrs) {
                                var _ptr = void 0;
                                var specPtrDef = setter.type.callback || setter.type.struct || setter.type.union || setter.type.array;
                                if (setter.type.indirection === 2 && specPtrDef) {
                                    _ptr = specPtrDef.makePtr(ptr);
                                } else {
                                    _ptr = ptr;
                                }
                                ptrs.push(_ptr);
                                setter.func(_ptr);
                            };
                        } else {
                            _this5['argSetter' + i++] = setter.func;
                        }
                    };

                    for (var _iterator2 = vmArgSetters[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                        _loop2();
                    }
                } catch (err) {
                    _didIteratorError2 = true;
                    _iteratorError2 = err;
                } finally {
                    try {
                        if (!_iteratorNormalCompletion2 && _iterator2.return) {
                            _iterator2.return();
                        }
                    } finally {
                        if (_didIteratorError2) {
                            throw _iteratorError2;
                        }
                    }
                }

                this.callerFunc = Promise.promisify(fn._makeCallerFunc());
                this.vm = null;
            };

            var ctx = new Ctx(this);
            var vmSize = this.library.options.vmSize;

            var innerFunc = void 0;
            try {
                innerFunc = new (Function.prototype.bind.apply(Function, [null].concat(_toConsumableArray(funcArgs.concat([funcBody])))))();
            } catch (err) {
                throw Error('Invalid function body: ' + funcBody);
            }

            var func = function func() {
                ctx.vm = dyncall.newCallVM(vmSize);
                return innerFunc.apply(ctx, arguments);
            };
            return this._initFunction(func);
        }
    }, {
        key: '_initFunction',
        value: function _initFunction(func) {
            func.function = this;
            func.type = this.type;
            var self = this;
            Object.defineProperties(func, {
                sync: {
                    get: function get() {
                        return self.sync();
                    }
                },
                async: {
                    get: function get() {
                        return self.async();
                    }
                }
            });
            return func;
        }
    }, {
        key: '_findVMSetterFunc',
        value: function _findVMSetterFunc(type) {
            return this.findFastcallFunc(dyncall, 'arg', type);
        }
    }, {
        key: '_makeCallerFunc',
        value: function _makeCallerFunc() {
            var _this6 = this;

            var name = void 0;
            var isPtr = false;
            var async = false;
            if (this.resultType.indirection > 1) {
                name = 'callPointer';
                isPtr = true;
            } else {
                name = 'call' + this.toFastcallName(this.resultType.name);
            }
            if (this.callMode === defs.callMode.async) {
                name += 'Async';
                async = true;
            }

            var func = dyncall[name];
            a && ert(_.isFunction(func));

            if (async) {
                if (isPtr) {
                    var _ret4 = function () {
                        var resultDerefType = ref.derefType(_this6.resultType);
                        return {
                            v: function v(vm, callback) {
                                func(vm, _this6._ptr, function (err, result) {
                                    if (err) {
                                        return callback(err);
                                    }
                                    result.type = resultDerefType;
                                    callback(null, result);
                                });
                            }
                        };
                    }();

                    if ((typeof _ret4 === 'undefined' ? 'undefined' : _typeof(_ret4)) === "object") return _ret4.v;
                }

                return function (vm, callback) {
                    return func(vm, _this6._ptr, callback);
                };
            }

            if (isPtr) {
                var _ret5 = function () {
                    var resultDerefType = ref.derefType(_this6.resultType);
                    return {
                        v: function v() {
                            var result = func(_this6._ptr);
                            result.type = resultDerefType;
                            return result;
                        }
                    };
                }();

                if ((typeof _ret5 === 'undefined' ? 'undefined' : _typeof(_ret5)) === "object") return _ret5.v;
            }

            return function () {
                return func(_this6._ptr);
            };
        }
    }]);

    return FastFunction;
}(FunctionDefinition);

module.exports = FastFunction;
//# sourceMappingURL=FastFunction.js.map