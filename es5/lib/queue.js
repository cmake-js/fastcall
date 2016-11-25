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

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var a = verify.a;
var ert = verify.ert;
var Promise = require('bluebird');

var top = Promise.resolve();
var length = 0;

Object.defineProperty(exports, 'length', { get: function get() {
        return length;
    } });

exports.next = function (f) {
    a && ert(_.isFunction(f));

    length++;
    top = top.catch(_.noop).then(function () {
        return Promise.try(f);
    }).finally(function () {
        length--;
    });

    return top;
};
//# sourceMappingURL=queue.js.map