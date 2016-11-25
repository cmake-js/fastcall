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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var a = verify.a;
var ert = verify.ert;
var ref = require('./ref-libs/ref');
var util = require('util');
var rex = require('./rex');

var FunctionParser = function () {
    function FunctionParser(parser) {
        _classCallCheck(this, FunctionParser);

        a && ert(parser);

        this.parser = parser;
    }

    _createClass(FunctionParser, [{
        key: 'parse',
        value: function parse(def) {
            if (_.isPlainObject(def)) {
                return this._parseObject(def);
            }
            if (_.isString(def)) {
                return this._parseString(def);
            }
            assert(false, 'Argument is not a function definition.');
        }
    }, {
        key: '_parseObject',
        value: function _parseObject(def) {
            // node-ffi format
            var keys = _.keys(def);
            assert(keys.length === 1, 'Object has invalid number of keys.');
            var name = keys[0];
            var arr = def[name];
            assert(_.isArray(arr), 'Function definition array expected.');
            assert(arr.length > 1, 'Function definition array is empty.');
            var resultType = this.parser._makeRef(arr[0]);
            var args = [];
            if (_.isArray(arr[1])) {
                for (var i = 0; i < arr[1].length; i++) {
                    args.push({
                        name: 'arg' + i,
                        type: this.parser._makeRef(arr[1][i])
                    });
                }
            }
            return { resultType: resultType, name: name, args: args };
        }
    }, {
        key: '_parseString',
        value: function _parseString(def) {
            var _this = this;

            var match = rex.matchFunction(def);
            assert(match, 'Invalid function definition format.');
            var resultType = this.parser._makeRef(match.resultType);
            var i = 0;
            var args = match.args.map(function (arg) {
                return _this.parser._parseDeclaration({
                    def: arg,
                    title: 'argument',
                    defaultName: 'arg' + i++,
                    isInterface: true
                });
            });
            return {
                resultType: resultType,
                name: match.name,
                args: args
            };
        }
    }]);

    return FunctionParser;
}();

module.exports = FunctionParser;
//# sourceMappingURL=FunctionParser.js.map