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

exports.split = split;

var blockBeginChars = {
    '(': ')',
    '[': ']',
    '{': '}'
};

var blockEndChars = {
    ')': '(',
    ']': '[',
    '}': '{'
};

function split(str) {
    a && ert(_.isString(str), 'Argument is not a string.');

    var parts = [];
    var blockCounters = {};
    var current = [];
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
        for (var _iterator = str[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
            var chr = _step.value;

            var blockEnd = blockBeginChars[chr];
            var blockBegin = blockEndChars[chr];
            if (blockEnd) {
                blockCounters[chr] = (blockCounters[chr] || 0) + 1;
            } else if (blockBegin) {
                blockCounters[blockBegin] = (blockCounters[blockBegin] || 0) - 1;
            } else if (chr === ';' && _(blockCounters).values().sum() === 0) {
                push();
                continue;
            }

            current.push(chr);
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

    assert(_(blockCounters).values().sum() === 0, 'Unlosed block in declaration.');
    push();

    return parts;

    function push() {
        if (current.length) {
            var currentStr = current.join('').trim();
            if (currentStr.length) {
                parts.push(currentStr);
            }
            current.length = 0;
        }
    }
}
//# sourceMappingURL=splitter.js.map