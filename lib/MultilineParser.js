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
const ref = require('./ref-libs/ref');
const util = require('util');
const rex = require('./rex');
const splitter = require('./splitter');
const defs = require('./defs');

class MultilineParser {
    constructor(parser) {
        a&&ert(parser);

        this.parser = parser;
    }

    parse(str, callMode) {
        assert(_.isString(str), 'Argument is not a string.');

        const lib = this.parser.library;
        for (const part of splitter.split(str)) {
            const match = rex.matchFunction(part);
            if (match) {
                if (match.isCallback) {
                    lib.callback(part);
                }
                else if (callMode === defs.callMode.sync) {
                    lib.syncFunction(part);
                }
                else if (callMode === defs.callMode.async) {
                    lib.asyncFunction(part);
                }
                else {
                    lib.function(part);
                }
            }
            else if (rex.matchArrayDeclaration(part)) {
                lib.array(part);
            }
            else if (rex.matchFields('struct', part)) {
                lib.struct(part);
            }
            else if (rex.matchFields('union', part)) {
                lib.union(part);
            }
            else {
                assert(false, `Invalid declaration: ${ part }`);
            }
        }
    }
}

module.exports = MultilineParser;