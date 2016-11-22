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
const verify = require('../verify');
const a = verify.a;
const ert = verify.ert;

module.exports = Callback;

let typeNameCounter = 0;

function Callback(resultType, argTypes, func) {
    if (!(this instanceof Callback)) {
        return new Callback(resultType, argTypes, func);
    }
    assert(resultType, 'Argument "resultType" expected.');
    assert(_.isArray(argTypes), 'Argument "argTypes" is not an array.');
    assert(_.isFunction(func), 'Argument "func" is not a function.');

    this._name = null;
    this._resultType = resultType;
    this._argTypes = argTypes;
    this._func = func;
    this._ptr = null;
    this._library = null;
}

Callback.prototype._makePtr = function (library) {
    a&&ert(library);

    if (!this._ptr || this._library !== library) {
        if (!this._name) {
            this._name = library.makeName('FFICallback');
        }
        let ptrFactory = library.interface[this._name];
        if (!ptrFactory) {
            library.callback({ [this._name]: [this._resultType, this._argTypes] });
            ptrFactory = library.interface[this._name];
        }
        a&&ert(_.isFunction(ptrFactory));
        this._ptr = ptrFactory(this._func);
        this._library = library;
    }
    return this._ptr;
}