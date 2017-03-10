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
var ArrayType = require('./ref-libs/array');
var StructType = require('./ref-libs/struct');
var UnionType = require('./ref-libs/union');
var util = require('util');
var rex = require('./rex');

var RefTypeParser = function () {
    function RefTypeParser(parser) {
        _classCallCheck(this, RefTypeParser);

        a && ert(parser);

        this.parser = parser;
    }

    _createClass(RefTypeParser, [{
        key: 'parse',
        value: function parse(def, typeHint) {
            if (_.isPlainObject(def)) {
                return this._parseObject(def, typeHint);
            }
            if (_.isString(def)) {
                return this._parseString(def, typeHint);
            }
            assert(false, 'Argument is not a ref type definition.');
        }
    }, {
        key: '_parseObject',
        value: function _parseObject(def, typeHint) {
            var keys = _.keys(def);
            assert(keys.length === 1, RefTypeParser._makeInvalidMessage(def));
            var name = keys[0];
            var body = def[name];
            var type = null;
            var factoryType = RefTypeParser._getFactoryType(typeHint);

            if (_.isFunction(body)) {
                type = body;
            } else if (_.isPlainObject(body) || _.isString(body)) {
                var created = this._makeType(factoryType, body);
                type = created.type;
                body = created.body;
            } else {
                assert(false, RefTypeParser._makeInvalidMessage(def));
            }

            return {
                name: name,
                factoryType: factoryType,
                body: body,
                type: type
            };
        }
    }, {
        key: '_parseString',
        value: function _parseString(def, typeHint) {
            var factoryType = RefTypeParser._getFactoryType(typeHint);
            var parsed = void 0;
            if (typeHint === 'array') {
                parsed = this._parseArray(def);
            } else {
                parsed = this._parseFields(def, typeHint);
            }

            var _makeType2 = this._makeType(factoryType, parsed.defBody, parsed.length),
                type = _makeType2.type,
                body = _makeType2.body;

            return {
                name: parsed.name,
                factoryType: factoryType,
                body: body,
                type: type
            };
        }
    }, {
        key: '_makeType',
        value: function _makeType(factoryType, body) {
            if (_.isPlainObject(body)) {
                body = this.parser._resolveStringTypes(body);
            } else if (_.isString(body)) {
                body = this.parser._resolveStringType(body);
            }

            for (var _len = arguments.length, args = Array(_len > 2 ? _len - 2 : 0), _key = 2; _key < _len; _key++) {
                args[_key - 2] = arguments[_key];
            }

            return { type: new (Function.prototype.bind.apply(factoryType, [null].concat([body], args)))(), body: body };
        }
    }, {
        key: '_parseFields',
        value: function _parseFields(def, keyword) {
            var match = rex.matchFields(keyword, def);
            assert(match, 'Invalid ' + keyword + ' definition format.');
            var defBody = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = match.parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var part = _step.value;

                    var fieldDecl = part.trim();
                    if (fieldDecl) {
                        var decl = this.parser._parseDeclaration({
                            def: part,
                            title: 'field',
                            isInterface: false
                        });
                        defBody[decl.name] = decl.type;
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

            return {
                name: match.name,
                defBody: defBody
            };
        }
    }, {
        key: '_parseArray',
        value: function _parseArray(def) {
            var match = rex.matchArrayDeclaration(def);
            assert(match, 'Invalid array definition format.');

            return match;
        }
    }], [{
        key: '_makeInvalidMessage',
        value: function _makeInvalidMessage(def) {
            return 'Invalid ref type definition: ' + util.inspect(def);
        }
    }, {
        key: '_getFactoryType',
        value: function _getFactoryType(typeHint) {
            switch (typeHint) {
                case 'array':
                    return ArrayType;
                case 'union':
                    return UnionType;
                case 'struct':
                    return StructType;
                default:
                    return assert(false, 'Unknown type hint: ' + typeHint);
            }
        }
    }]);

    return RefTypeParser;
}();

module.exports = RefTypeParser;
//# sourceMappingURL=RefTypeParser.js.map