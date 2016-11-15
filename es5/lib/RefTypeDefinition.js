'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var ref = require('./ref-libs/ref');
var Parser = require('./Parser');

var RefTypeDefinition = function () {
    function RefTypeDefinition(args) {
        _classCallCheck(this, RefTypeDefinition);

        verify(args);

        assert(_.isObject(args.library), '"library" is not an object.');
        verify(_.isString(args.propertyName), '"args.propertyName" is not a string.');
        this.library = args.library;
        this.propertyName = args.propertyName;
        this._FactoryType = args.FactoryType;

        if (_.isString(args.def)) {
            var parsed = this._parse(args.def);
            this.name = parsed.name;
            this._defBody = parsed.defBody;
            this._type = this._typeFactory();
        } else {
            this.name = _.keys(args.def)[0];
            assert(_.isString(this.name), '"def" is invalid.');
            this._defBody = args.def[this.name];

            if (_.isFunction(this._defBody)) {
                this._type = this._defBody;
            } else if (_.isObject(this._defBody) || _.isString(this._defBody)) {
                this._type = this._typeFactory();
            } else {
                assert(false, '"def" is invalid.');
            }
        }
        this._type[this.propertyName] = this;
    }

    _createClass(RefTypeDefinition, [{
        key: 'getFactory',
        value: function getFactory() {
            var _this = this;

            var factory = function factory(value) {
                return _this.makePtr(value);
            };
            factory[this.propertyName] = this;
            factory.type = this.type;
            return factory;
        }
    }, {
        key: 'makePtr',
        value: function makePtr(value) {
            var propName = this.propertyName;
            if (value) {
                if (value instanceof Buffer) {
                    return value;
                }

                if (_.isPlainObject(value) || _.isArray(value) || _.isString(value)) {
                    value = new this.type(value);
                }

                if (value.buffer instanceof Buffer) {
                    value = value.buffer;
                } else if (_.isFunction(value.ref)) {
                    value = value.ref();
                }

                if (!value.type) {
                    value.type = this.type;
                }

                if (!value[propName]) {
                    value[propName] = this;
                }

                return value;
            } else if (value === null) {
                return null;
            }
            throw new TypeError('Cannot make ' + propName + ' from: ' + value);
        }
    }, {
        key: '_parse',
        value: function _parse(str) {
            var parser = new Parser(this.library);
            return parser.parseFields(str, this.propertyName);
        }
    }, {
        key: '_typeFactory',
        value: function _typeFactory() {
            verify(_.isFunction(this._FactoryType), '"args.FactoryType" is not a function.');
            verify(this._defBody);
            if (_.isPlainObject(this._defBody)) {
                this._defBody = this._resolveStringTypes(this._defBody);
            }
            if (_.isString(this._defBody)) {
                this._defBody = this._resolveStringType(this._defBody);
            }
            return new this._FactoryType(this._defBody);
        }
    }, {
        key: '_resolveStringTypes',
        value: function _resolveStringTypes(defObj) {
            var _this2 = this;

            var result = {};
            _.each(defObj, function (value, key) {
                var type = defObj[key];
                if (_.isString(type)) {
                    type = _this2._resolveStringType(type);
                }
                result[key] = type;
            });
            return result;
        }
    }, {
        key: '_resolveStringType',
        value: function _resolveStringType(type) {
            var match = /(\w+)\s*(?:\[\s*(\d+)\s*\])?/.exec(type);
            if (match) {
                type = match[1];
                var def = this.library.findRefDeclaration(type);
                if (def) {
                    type = def.type;
                    if (match[2]) {
                        type = def._makeTypeWithLength(match[2]);
                    }
                }
            }
            return type;
        }
    }, {
        key: '_makeTypeWithLength',
        value: function _makeTypeWithLength(len) {
            len = _.isString(len) ? Number.parseInt(len) : len;
            var itemType = this._defBody;
            var FactoryType = this._FactoryType;
            assert(len > 0 && itemType && _.isFunction(FactoryType), 'Invalid array type definition.');
            return new FactoryType(itemType, len);
        }
    }, {
        key: 'type',
        get: function get() {
            return this._type;
        }
    }]);

    return RefTypeDefinition;
}();

module.exports = RefTypeDefinition;
//# sourceMappingURL=RefTypeDefinition.js.map