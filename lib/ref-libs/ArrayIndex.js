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

function ArrayIndex() {
  this._length = 0;
}

Object.defineProperties(ArrayIndex.prototype, {
  length: {
    get: function () {
      return this._length;
    },
    set: function (value) {
      this._length = value;
      if (this[ArrayIndex.lengthChanged]) {
        this[ArrayIndex.lengthChanged](value);
      }
    }
  },
  '0': {
    get: notSupported,
    set: notSupported
  },
  '1': {
    get: notSupported,
    set: notSupported
  },
  '2': {
    get: notSupported,
    set: notSupported
  },
  '3': {
    get: notSupported,
    set: notSupported
  },
  '4': {
    get: notSupported,
    set: notSupported
  }
});

ArrayIndex.prototype.toArray = function () {
  const array = [];
  for (let i = 0; i < this.length; i++) {
    array[i] = this.get(i);
  }
  return array;
};

ArrayIndex.prototype.toJSON = function () {
  return this.toArray();
};

ArrayIndex.prototype.inspect = function () {
  return this.toArray();
};

ArrayIndex.prototype.toString = function () {
  const a = this.toArray();
  return a.toString(...arguments);
};

ArrayIndex.get = 'get';
ArrayIndex.set = 'set';
ArrayIndex.lengthChanged = '_lengthChanged';

function notSupported() {
  throw new Error('Accessing ArrayType by index is not supported. Use methods of "get()" and "set()" for this purpose.');
}

module.exports = ArrayIndex;