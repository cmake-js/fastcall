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
const Callback = require('./Callback');
const assert = require('assert');
const ref = require('../ref-libs/ref');

module.exports = Function;

const pointer = ref.refType('void');

function Function(resultType, argTypes) {
    if (!(this instanceof Function)) {
        return new Function(resultType, argTypes);
    }
    assert(resultType, 'Argument "resultType" expected.');
    assert(_.isArray(argTypes), 'Argument "argTypes" is not an array.');

    this._resultType = resultType;
    this._argTypes = argTypes;
}

Function.prototype.size = ref.sizeof.pointer;

Function.prototype.alignment = ref.alignof.pointer;

Function.prototype.indirection = 1;

Function.prototype.name = 'Function';

Function.prototype.toPointer = function (func) {
    return new Callback(this._resultType, this._argTypes, func);
}

Function.prototype.get = pointer.get;

Function.prototype.set = function set (buffer, offset, value) {
  var ptr
  if ('function' == typeof value) {
        ptr = this.toPointer(value)
  } 
  else if (Buffer.isBuffer(value)) {
        ptr = value
  } 
  else {
        throw new Error('don\'t know how to set callback function for: ' + value)
  }
  pointer.set(ptr, offset);
}