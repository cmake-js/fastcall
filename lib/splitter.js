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

exports.split = split;

const blockBeginChars = {
    '(': ')',
    '[': ']',
    '{': '}'
};

const blockEndChars = {
    ')': '(',
    ']': '[',
    '}': '{'
};

function split(str) {
    a&&ert(_.isString(str), 'Argument is not a string.');

    const parts = [];
    const blockCounters = {};
    let current = [];
    for (const chr of str) {
        const blockEnd = blockBeginChars[chr];
        const blockBegin = blockEndChars[chr];
        if (blockEnd) {
            blockCounters[chr] = (blockCounters[chr] || 0) + 1;
        }
        else if (blockBegin) {
            blockCounters[blockBegin] = (blockCounters[blockBegin] || 0) - 1;
        }
        else if (chr === ';' && _(blockCounters).values().sum() === 0) {
            push();
            continue;
        }

        current.push(chr);
    }

    assert(_(blockCounters).values().sum() === 0, 'Unlosed block in declaration.');
    push();

    return parts;

    function push() {
        if (current.length) {
            const currentStr = current.join('').trim();
            if (currentStr.length) {
                parts.push(currentStr);
            }
            current.length = 0;
        }
    }
}