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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var scope = require('./scope');
var native = require('./native');
var weak = native.weak;
var assert = require('assert');

var Disposable = function () {
    function Disposable(disposeFunction, approxExternalMemoryUse) {
        _classCallCheck(this, Disposable);

        this._watched = {};
        this._dispose = watch(this._watched, disposeFunction, approxExternalMemoryUse);
        this._disposed = false;
        scope._add(this);
    }

    _createClass(Disposable, [{
        key: 'dispose',
        value: function dispose() {
            return doDispose(this);
        }
    }, {
        key: 'resetDisposable',
        value: function resetDisposable(disposeFunction, approxExternalMemoryUse) {
            this._watched = {};
            this._dispose = watch(this._watched, disposeFunction, approxExternalMemoryUse);
            this._disposed = false;
        }
    }]);

    return Disposable;
}();

Disposable.Legacy = LegacyDisposable;

function LegacyDisposable(disposeFunction, approxExternalMemoryUse) {
    this._dispose = watch(this, disposeFunction, approxExternalMemoryUse);
    this._disposed = false;
    scope._add(this);
}

LegacyDisposable.prototype.dispose = function () {
    return doDispose(this);
};

LegacyDisposable.prototype.resetDisposable = function (disposeFunction, approxExternalMemoryUse) {
    this._watched = {};
    this._dispose = watch(this._watched, disposeFunction, approxExternalMemoryUse);
    this._disposed = false;
};

function watch(obj, disposeFunction) {
    var approxExternalMemoryUse = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : 0;

    var disposed = false;
    assertDisposeFunction(disposeFunction);
    var weakCallback = function weakCallback() {
        if (disposed) {
            return;
        }
        var result = void 0;
        if (disposeFunction) {
            result = disposeFunction();
            if (approxExternalMemoryUse > 0) {
                weak.adjustExternalMemory(-approxExternalMemoryUse);
            }
        }
        disposed = true;
        return result;
    };
    weak.watch(obj, weakCallback);
    if (disposeFunction && approxExternalMemoryUse > 0) {
        weak.adjustExternalMemory(approxExternalMemoryUse);
    }
    return weakCallback;
}

function assertDisposeFunction(disposeFunction) {
    assert(_.isFunction(disposeFunction) || disposeFunction === null, 'Missing disposeFunction argument. This functiion should release native resources. Please note that this dispose method has no ' + 'parameters, and only allowed to capture native handles from the source object, not a reference of the source itself, ' + 'because that would prevent garbage collection! Refer to fastcall readme at Github for more information.');
}

function doDispose(obj) {
    if (obj._disposed) {
        return;
    }
    var result = void 0;
    if (obj._dispose) {
        result = obj._dispose();
    }
    obj._disposed = true;
    return result;
}

module.exports = scope.Disposable = Disposable;
//# sourceMappingURL=Disposable.js.map