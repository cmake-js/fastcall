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
var splitter = require('./splitter');
var defs = require('./defs');

var MultilineParser = function () {
    function MultilineParser(parser) {
        _classCallCheck(this, MultilineParser);

        a && ert(parser);

        this.parser = parser;
    }

    _createClass(MultilineParser, [{
        key: 'parse',
        value: function parse(str, callMode) {
            assert(_.isString(str), 'Argument is not a string.');

            var lib = this.parser.library;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = splitter.split(str)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var part = _step.value;

                    var match = rex.matchFunction(part);
                    if (match) {
                        if (match.isCallback) {
                            lib.callback(part);
                        } else if (callMode === defs.callMode.sync) {
                            lib.syncFunction(part);
                        } else if (callMode === defs.callMode.async) {
                            lib.asyncFunction(part);
                        } else {
                            lib.function(part);
                        }
                    } else if (rex.matchArrayDeclaration(part)) {
                        lib.array(part);
                    } else if (rex.matchFields('struct', part)) {
                        lib.struct(part);
                    } else if (rex.matchFields('union', part)) {
                        lib.union(part);
                    } else {
                        assert(false, 'Invalid declaration: ' + part);
                    }
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
        }
    }]);

    return MultilineParser;
}();

module.exports = MultilineParser;
//# sourceMappingURL=MultilineParser.js.map