'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var ref = require('./ref-libs/ref');
var util = require('util');

var IS_X64 = process.arch === 'x64';

var Parser = function () {
    function Parser(library) {
        _classCallCheck(this, Parser);

        verify(library);

        this.library = library;
    }

    _createClass(Parser, [{
        key: 'parseFunctionObject',
        value: function parseFunctionObject(def) {
            verify(_.isPlainObject(def));

            // node-ffi format
            var keys = _.keys(def);
            assert(keys.length === 1, 'Object has invalid number of keys.');
            var name = keys[0];
            var arr = def[name];
            assert(_.isArray(arr), 'Function definition array expected.');
            assert(arr.length > 1, 'Function definition array is empty.');
            var resultType = this._makeRef(arr[0]);
            var args = [];
            if (_.isArray(arr[1])) {
                for (var i = 0; i < arr[1].length; i++) {
                    args.push({
                        name: 'arg' + i,
                        type: this._makeRef(arr[1][i])
                    });
                }
            }
            return { resultType: resultType, name: name, args: args };
        }
    }, {
        key: 'parseFunctionString',
        value: function parseFunctionString(def) {
            var _this = this;

            verify(_.isString(def));

            var parts = /^\s*([\w_][\w\d_]*\s*\**)\s*([\w_][\w\d_]*)\s*\((.*)\)\s*$/.exec(def);
            assert(parts && parts.length === 4, 'Invalid function definition format.');
            var resultType = this._makeRef(parts[1]);
            var name = parts[2].trim();
            var args = parts[3].trim();
            args = args ? args.split(',') : [];
            var i = 0;
            args = args.map(function (arg) {
                return _this._parseDeclaration({
                    def: arg,
                    name: 'argument',
                    defaultName: 'arg' + i++,
                    isInterface: true
                });
            });
            return { resultType: resultType, name: name, args: args };
        }
    }, {
        key: 'parseFields',
        value: function parseFields(def, keyword) {
            verify(_.isString(def));

            var rex = new RegExp(keyword + '\\s*(\\w+)\\s*{(.*)}');
            var match = rex.exec(def);
            assert(match && match.length === 3, 'Invalid ' + keyword + ' definition format.');
            var name = match[1];
            var content = match[2];
            var parts = content.split(';');
            var defBody = {};
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = parts[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var part = _step.value;

                    var fieldDecl = part.trim();
                    if (fieldDecl) {
                        var decl = this._parseDeclaration({
                            def: part,
                            name: 'declaration',
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

            return { name: name, defBody: defBody };
        }
    }, {
        key: 'parseArray',
        value: function parseArray(def) {
            verify(_.isString(def));

            var match = /(\w+)\s*\[\s*\]\s*(\w+)/.exec(def);
            assert(match && match.length === 3, 'Invalid array definition format.');

            return { name: match[2], defBody: match[1] };
        }
    }, {
        key: '_parseDeclaration',
        value: function _parseDeclaration(args) {
            var def = args.def;
            var name = args.name;
            def = def.trim();
            assert(def, 'Invalid ' + name + ': ' + def);
            var pos = _.lastIndexOf(def, ' ');
            if (pos === -1) {
                pos = _.lastIndexOf(def, '*');
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
            assert(part1, 'Invalid ' + name + ': ' + def);
            if (!part2 && !args.defaultName) {
                assert(false, name + ' declaration\'s name expected.');
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
                    verify(callback.type.code);
                    verify(callback.type.callback === callback);
                    return callback.type;
                }
                var nameMatch = /((\w+)\s*(?:\[\s*(\d+)\s*\])?)([\s\*]*)/.exec(value);
                if (nameMatch && nameMatch.length === 5) {
                    var name = nameMatch[2];
                    var def = this.library.structs[name] || this.library.unions[name] || this.library.arrays[name];
                    if (def) {
                        var _type = def.type;
                        if (nameMatch[3]) {
                            _type = def._makeTypeWithLength(nameMatch[3]);
                        }
                        var starCount = Parser._countStars(nameMatch[4]);
                        if (isInteface) {
                            assert(starCount, 'Using struct or unions by value on function interfaces is not supported.');
                        }
                        for (var i = 0; i < starCount; i++) {
                            _type = ref.refType(_type);
                        }
                        if (starCount) {
                            _type.code = Parser.getTypeCode(_type);
                        }
                        _type[def.propertyName] = def;
                        return _type;
                    }
                }
            }
            var type = ref.coerceType(value);
            type.code = Parser.getTypeCode(type);
            this._ensureRegistered(type);
            return type;
        }
    }, {
        key: '_ensureRegistered',
        value: function _ensureRegistered(type) {
            var rootType = type;
            while (rootType.indirection > 1) {
                rootType = ref.derefType(rootType);
            }
            var regTo = null;
            var regBy = null;
            var typeStr = String(rootType);
            if (typeStr === '[StructType]') {
                regTo = this.library.structs;
                regBy = 'struct';
            } else if (typeStr === '[UnionType]') {
                regTo = this.library.unions;
                regBy = 'union';
            } else if (typeStr === '[ArrayType]') {
                regTo = this.library.arrays;
                regBy = 'array';
            }

            if (!regTo) {
                return;
            }

            var i = 0;
            var name = makeName(i);
            while (regTo[name]) {
                name = makeName(++i);
            }

            this.library[regBy](_defineProperty({}, name, rootType));

            function makeName(i) {
                var iStr = String(i);
                if (iStr.length === 0) {
                    iStr = '0' + iStr;
                }
                return rootType.name + iStr;
            }
        }
    }], [{
        key: 'getTypeCode',
        value: function getTypeCode(type) {
            var indirection = _.isObject(type) ? type.indirection : 0;
            var name = _.isString(type) ? type : type.name;

            if (indirection > 1) {
                return 'p';
            }
            switch (name) {
                case 'bool':
                    return 'B';
                case 'char':
                    return 'c';
                case 'uchar':
                    return 'C';
                case 'short':
                    return 's';
                case 'ushort':
                    return 'S';
                case 'int':
                    return 'i';
                case 'uint':
                    return 'I';
                case 'long':
                    return 'j';
                case 'ulong':
                    return 'J';
                case 'longlong':
                    return 'l';
                case 'ulonglong':
                    return 'L';
                case 'float':
                    return 'f';
                case 'double':
                    return 'd';
                case 'int8':
                    return Parser.getTypeCode('char');
                case 'uint8':
                    return Parser.getTypeCode('uchar');
                case 'int16':
                    return Parser.getTypeCode('short');
                case 'uint16':
                    return Parser.getTypeCode('ushort');
                case 'int32':
                    return Parser.getTypeode('int');
                case 'uint32':
                    return Parser.getTypeode('uint');
                case 'int64':
                    return Parser.getTypeCode('longlong');
                case 'uint64':
                    return Parser.getTypeCode('ulonglong');
                case 'size_t':
                    return Parser.getTypeCode('ulong');
                case 'byte':
                    return Parser.getTypeCode('uint8');
                case 'void':
                    return 'v';
                default:
                    assert(false, 'Unknonwn type: ' + type.name);
            }
        }
    }, {
        key: '_countStars',
        value: function _countStars(def) {
            var count = 0;
            var _iteratorNormalCompletion2 = true;
            var _didIteratorError2 = false;
            var _iteratorError2 = undefined;

            try {
                for (var _iterator2 = def[Symbol.iterator](), _step2; !(_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done); _iteratorNormalCompletion2 = true) {
                    var ch = _step2.value;

                    if (ch === '*') {
                        ++count;
                    }
                }
            } catch (err) {
                _didIteratorError2 = true;
                _iteratorError2 = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }
                } finally {
                    if (_didIteratorError2) {
                        throw _iteratorError2;
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