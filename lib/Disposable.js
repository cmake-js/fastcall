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
const scope = require('./scope');
const native = require('./native');
const weak = native.weak;
const assert = require('assert');

class Disposable {
    constructor(disposeFunction, approxExternalMemoryUse) {
        this._watched = {};
        this._dispose = watch(this._watched, disposeFunction, approxExternalMemoryUse);
        this._disposed = false;
        scope._add(this);
    }

    dispose() {
        return doDispose(this);
    }

    resetDisposable(disposeFunction, approxExternalMemoryUse) {
        this._watched = {};
        this._dispose = watch(this._watched, disposeFunction, approxExternalMemoryUse);
        this._disposed = false;
    }
}

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

function watch(obj, disposeFunction, approxExternalMemoryUse = 0) {
    let disposed = false;
    assertDisposeFunction(disposeFunction);
    const weakCallback = () => {
        if (disposed) {
            return;
        }
        let result;
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
    assert(_.isFunction(disposeFunction) || disposeFunction === null,
        'Missing disposeFunction argument. This functiion should release native resources. Please note that this dispose method has no ' +
        'parameters, and only allowed to capture native handles from the source object, not a reference of the source itself, ' +
        'because that would prevent garbage collection! Refer to fastcall readme at Github for more information.');
}

function doDispose(obj) {
    if (obj._disposed) {
        return;
    }
    let result;
    if (obj._dispose) {
        result = obj._dispose();
    }
    obj._disposed = true;
    return result;
}

module.exports = scope.Disposable = Disposable;
