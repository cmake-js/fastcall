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
var Parser = require('./Parser');
var rex = require('./rex');

var RefTypeDefinition = function () {
    function RefTypeDefinition(library, propertyName, def) {
        _classCallCheck(this, RefTypeDefinition);

        a && ert(_.isObject(library), 'Argument "library" is not an object.');
        a && ert(_.isString(propertyName), 'Argument "propertyName" is not a string.');
        this.library = library;
        this.propertyName = propertyName;

        var parser = new Parser(library);
        var parsed = parser.parseRefType(def, propertyName);
        a && ert(_.isObject(parsed));
        a && ert(parsed.body);
        a && ert(_.isFunction(parsed.factoryType));
        a && ert(parsed.type);
        a && ert(_.isString(parsed.name) && parsed.name.length);

        this.name = parsed.name;
        this._body = parsed.body;
        this._factoryType = parsed.factoryType;
        this._type = parsed.type;
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

                if (_.isObject(value)) {
                    if (value.type === undefined) {
                        value.type = this.type;
                    }

                    if (value[propName] === undefined) {
                        value[propName] = this;
                    }

                    if (value[propName] === this) {
                        return value;
                    }

                    throw new TypeError('Buffer is not a ' + propName + ' pointer.');
                }
            } else if (value === null) {
                return ref.NULL;
            }
            throw new TypeError('Cannot make ' + propName + ' from: ' + util.inspect(value));
        }
    }, {
        key: '_makeTypeWithLength',
        value: function _makeTypeWithLength(len) {
            len = _.isString(len) ? Number.parseInt(len) : len;
            var itemType = this._body;
            var FactoryType = this._factoryType;
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