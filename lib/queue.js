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
const verify = require('./verify');
const a = verify.a;
const ert = verify.ert;
const Promise = require('bluebird');

let top = Promise.resolve();
let length = 0;

Object.defineProperty(exports, 'length', { get: () => length });

exports.next = function (f) {
    a&&ert(_.isFunction(f));

    length++;        
    top = top
    .catch(_.noop)
    .then(() => {
        return Promise.try(f);
    })
    .finally(() => {
        length--;
    });

    return top;
}