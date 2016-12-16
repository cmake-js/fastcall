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

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var a = verify.a;
var ert = verify.ert;
var ref = require('./ref-libs/ref');
var util = require('util');
var rex = require('./rex');
var typeCode = require('./typeCode');
var FunctionParser = require('./FunctionParser');
var RefTypeParser = require('./RefTypeParser');
var MultilineParser = require('./MultilineParser');
var refHelpers = require('./refHelpers');

var Parser = function () {
    function Parser(library) {
        _classCallCheck(this, Parser);

        a && ert(library);

        this.library = library;
        this.functionParser = new FunctionParser(this);
        this.refTypeParser = new RefTypeParser(this);
        this.multilineParser = new MultilineParser(this);
    }

    _createClass(Parser, [{
        key: 'parseFunction',
        value: function parseFunction(def) {
            return this.functionParser.parse(def);
        }
    }, {
        key: 'parseRefType',
        value: function parseRefType(def, typeHint) {
            return this.refTypeParser.parse(def, typeHint);
        }
    }, {
        key: 'parseMultiline',
        value: function parseMultiline(str, callMode) {
            return this.multilineParser.parse(str, callMode);
        }
    }, {
        key: '_parseDeclaration',
        value: function _parseDeclaration(args) {
            var def = args.def;
            var title = args.title;
            def = def.trim();
            assert(def, 'Invalid ' + title + ': ' + def);
            var pos = _.lastIndexOf(def, '*');
            if (pos === -1) {
                pos = _.lastIndexOf(def, ' ');
            }
            if (pos === -1) {
                pos = def.length - 1;
            }
            var part1 = def.substr(0, pos + 1).trim();
            var part2 = def.substr(pos + 1).trim();
            if (!part1 && part2) {
                part1 = part2;
                part2 = null;
            }
            assert(part1, 'Invalid ' + title + ': ' + def);
            if (!part2 && !args.defaultName) {
                assert(false, title + ' declaration\'s name expected.');
            }
            return {
                name: part2 || args.defaultName,
                type: this._makeRef(part1, args.isInterface)
            };
        }
    }, {
        key: '_makeRef',
        value: function _makeRef(value, isInteface) {
            if (isInteface === undefined) {
                isInteface = true;
            }
            if (_.isString(value)) {
                var callback = this.library.callbacks[value];
                if (callback) {
                    a && ert(callback.type.code);
                    a && ert(callback.type.callback === callback);
                    return callback.type;
                }
                var match = rex.matchType(value);
                if (match) {
                    var name = match.name;
                    var def = this.library.structs[name] || this.library.unions[name] || this.library.arrays[name];
                    if (def) {
                        var _type = def.type;
                        if (match.length) {
                            _type = def._makeTypeWithLength(match.length);
                        }
                        var starCount = Parser._countStars(match.stars);
                        for (var i = 0; i < starCount; i++) {
                            _type = ref.refType(_type);
                        }
                        if (isInteface) {
                            assert(_type.indirection > 1 || refHelpers.isArrayType(_type), 'Using struct or unions by value on function interfaces is not supported.');
                        }
                        if (starCount) {
                            if (_type.code === undefined) {
                                _type.code = typeCode.getForType(_type);
                            }
                            if (_type[def.propertyName] === undefined) {
                                _type[def.propertyName] = def;
                            }
                        }
                        return _type;
                    }
                }
            }
            var type = ref.coerceType(value);
            if (type.code === undefined) {
                type.code = typeCode.getForType(type);
            }
            this._ensureRegistered(type);
            return type;
        }
    }, {
        key: '_ensureRegistered',
        value: function _ensureRegistered(type) {
            var rootType = type;
            while (rootType.indirection > 1 || refHelpers.isArrayType(rootType)) {
                if (rootType.indirection > 1) {
                    rootType = ref.derefType(rootType);
                } else {
                    rootType = rootType.type;
                }
            }
            var regBy = null;
            if (refHelpers.isStructType(rootType)) {
                regBy = 'struct';
            } else if (refHelpers.isUnionType(rootType)) {
                regBy = 'union';
            } else if (refHelpers.isArrayType(rootType)) {
                regBy = 'array';
            }

            if (!regBy) {
                return;
            }

            this.library[regBy](_defineProperty({}, this.library.makeName(rootType.name), rootType));
        }
    }, {
        key: '_resolveStringTypes',
        value: function _resolveStringTypes(defObj) {
            var _this = this;

            a && ert(_.isObject(defObj));

            var result = {};
            _.each(defObj, function (value, key) {
                var type = defObj[key];
                if (_.isString(type)) {
                    type = _this._resolveStringType(type);
                }
                result[key] = type;
            });
            return result;
        }
    }, {
        key: '_resolveStringType',
        value: function _resolveStringType(type) {
            a && ert(_.isString(type));

            var match = rex.matchType(type);
            if (match) {
                type = match.name;
                var def = this.library.findRefDeclaration(type);
                if (def) {
                    type = def.type;
                    if (match.length) {
                        type = def._makeTypeWithLength(match.length);
                    }
                }
            }
            var starCount = Parser._countStars(match.stars);
            for (var i = 0; i < starCount; i++) {
                type = ref.refType(type);
            }
            return type;
        }
    }], [{
        key: '_countStars',
        value: function _countStars(str) {
            var count = 0;
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = str[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var ch = _step.value;

                    if (ch === '*') {
                        ++count;
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

            return count;
        }
    }]);

    return Parser;
}();

module.exports = Parser;
//# sourceMappingURL=Parser.js.map