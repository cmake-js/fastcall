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
const Parser = require('./Parser');
const typeCode = require('./typeCode');

class FunctionDefinition {
    constructor(library, def) {
        assert(_.isObject(library));
        this.library = library;
        const parser = new Parser(library);
        if (_.isString(def) || _.isPlainObject(def)) {
            def = parser.parseFunction(def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        }
        else if (def.resultType && def.name && def.args) {
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        }
        else {
            throw new TypeError(`Invalid function definition: ${ def }.`);
        }

        assert(_.isObject(this.resultType));
        assert(_.isString(this.name) && this.name.length);
        assert(_.isArray(this.args));

        this.signature = this._makeSignature();
        this._type = ref.refType(ref.types.void);
        this._type.code = typeCode.getForType(this._type);
        this._type.name = this.name;
    }

    get type() {
        return this._type;
    }

    toString() {
        let args = this.args.map(arg => util.format('%s %s', getTypeName(arg.type), arg.name)).join(', ');
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

    toFastcallName(typeName) {
        return _.upperFirst(_.camelCase(typeName))
            .replace('Uint', 'UInt')
            .replace('Longlong', 'LongLong');
    }

    findFastcallFunc(api, prefix, type) {
        const name = prefix + (type.indirection > 1 || type.code === 'p' ? 'Pointer' : this.toFastcallName(type.name));
        const func = api[name];
        a&&ert(_.isFunction(func), `Unknown API '${ name }' for function '${ this }'.`);
        return { name, type, func };
    }

    _makeSignature() {
        const argTypes =
            this.args.map(a => a.type.code);

        return `${ argTypes })${ this.resultType.code }`;
    }
}

module.exports = FunctionDefinition;