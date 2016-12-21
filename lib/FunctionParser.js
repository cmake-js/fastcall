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

class FunctionParser {
    constructor(parser) {
        a&&ert(parser);

        this.parser = parser;
    }

    parse(def) {
        if (_.isPlainObject(def)) {
            return this._parseObject(def);
        }
        if (_.isString(def)) {
            return this._parseString(def);
        }
        assert(false, 'Argument is not a function definition.');
    }

    _parseObject(def) {
        // node-ffi format
        const keys = _.keys(def);
        assert(keys.length === 1, 'Object has invalid number of keys.');
        const name = keys[0];
        const arr = def[name];
        assert(_.isArray(arr), 'Function definition array expected.');
        assert(arr.length > 1, 'Function definition array is empty.');
        const resultType = this.parser._makeRef(arr[0]);
        const args = [];
        if (_.isArray(arr[1])) {
            for (let i = 0; i < arr[1].length; i++) {
                args.push({
                    name: 'arg' + i,
                    type: this.parser._makeRef(arr[1][i])
                });
            }
        }
        return { resultType, name, args };
    }

    _parseString(def) {
        const match = rex.matchFunction(def);
        assert(match, 'Invalid function definition format.');
        const resultType = this.parser._makeRef(match.resultType);
        let i = 0;
        const args = match.args.map(arg => this.parser._parseDeclaration({
            def: arg,
            title: 'argument',
            defaultName: 'arg' + i++,
            isInterface: true
        }));
        return {
            resultType,
            name: match.name,
            args
        };
    }
}

module.exports = FunctionParser;