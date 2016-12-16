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
var Parser = require('./Parser');
var typeCode = require('./typeCode');

var FunctionDefinition = function () {
    function FunctionDefinition(library, def) {
        _classCallCheck(this, FunctionDefinition);

        assert(_.isObject(library));
        this.library = library;
        var parser = new Parser(library);
        if (_.isString(def) || _.isPlainObject(def)) {
            def = parser.parseFunction(def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        } else if (def.resultType && def.name && def.args) {
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        } else {
            throw new TypeError('Invalid function definition: ' + def + '.');
        }

        assert(_.isObject(this.resultType));
        assert(_.isString(this.name) && this.name.length);
        assert(_.isArray(this.args));

        this.signature = this._makeSignature();
        this._type = ref.refType(ref.types.void);
        this._type.code = typeCode.getForType(this._type);
        this._type.name = this.name;
    }

    _createClass(FunctionDefinition, [{
        key: 'toString',
        value: function toString() {
            var args = this.args.map(function (arg) {
                return util.format('%s %s', getTypeName(arg.type), arg.name);
            }).join(', ');
            return util.format('%s %s(%s)', getTypeName(this.resultType), this.name, args);

            function getTypeName(type) {
                if (type.function) {
                    return type.function.name;
                }
                if (type.callback) {
                    return type.callback.name;
                }
                return type.name;
            }
        }
    }, {
        key: 'toFastcallName',
        value: function toFastcallName(typeName) {
            return _.upperFirst(_.camelCase(typeName)).replace('Uint', 'UInt').replace('Longlong', 'LongLong');
        }
    }, {
        key: 'findFastcallFunc',
        value: function findFastcallFunc(api, prefix, type) {
            var name = prefix + (type.indirection > 1 || type.code === 'p' ? 'Pointer' : this.toFastcallName(type.name));
            var func = api[name];
            a && ert(_.isFunction(func), 'Unknown API \'' + name + '\' for function \'' + this + '\'.');
            return { name: name, type: type, func: func };
        }
    }, {
        key: '_makeSignature',
        value: function _makeSignature() {
            var argTypes = this.args.map(function (a) {
                return a.type.code;
            });

            return argTypes + ')' + this.resultType.code;
        }
    }, {
        key: 'type',
        get: function get() {
            return this._type;
        }
    }]);

    return FunctionDefinition;
}();

module.exports = FunctionDefinition;
//# sourceMappingURL=FunctionDefinition.js.map