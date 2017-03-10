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
const ArrayType = require('./ref-libs/array');
const StructType = require('./ref-libs/struct');
const UnionType = require('./ref-libs/union');
const util = require('util');
const rex = require('./rex');

class RefTypeParser {
    constructor(parser) {
        a&&ert(parser);

        this.parser = parser;
    }

    parse(def, typeHint) {
        if (_.isPlainObject(def)) {
            return this._parseObject(def, typeHint);
        }
        if (_.isString(def)) {
            return this._parseString(def, typeHint);
        }
        assert(false, 'Argument is not a ref type definition.');
    }

    _parseObject(def, typeHint) {
        const keys = _.keys(def);
        assert(keys.length === 1, RefTypeParser._makeInvalidMessage(def));
        const name = keys[0];
        let body = def[name];
        let type = null;
        let factoryType = RefTypeParser._getFactoryType(typeHint);

        if (_.isFunction(body)) {
            type = body;
        }
        else if (_.isPlainObject(body) || _.isString(body)) {
            let created = this._makeType(factoryType, body);
            type = created.type;
            body = created.body;
        }
        else {
            assert(false, RefTypeParser._makeInvalidMessage(def));
        }

        return {
            name,
            factoryType,
            body,
            type
        };
    }

    _parseString(def, typeHint) {
        const factoryType = RefTypeParser._getFactoryType(typeHint);
        let parsed;
        if (typeHint === 'array') {
            parsed = this._parseArray(def);
        }
        else {
            parsed = this._parseFields(def, typeHint);
        }
        const { type, body } = this._makeType(factoryType, parsed.defBody, parsed.length);
        return {
            name: parsed.name,
            factoryType,
            body,
            type
        };
    }

    _makeType(factoryType, body, ...args) {
        if (_.isPlainObject(body)) {
            body = this.parser._resolveStringTypes(body);
        }
        else if (_.isString(body)) {
            body = this.parser._resolveStringType(body);
        }
        return { type: new factoryType(body, ...args), body };
    }

    static _makeInvalidMessage(def) {
        return `Invalid ref type definition: ${ util.inspect(def) }`;
    }

    static _getFactoryType(typeHint) {
        switch (typeHint) {
            case 'array':
                return ArrayType;
            case 'union':
                return UnionType;
            case 'struct':
                return StructType;
            default:
                return assert(false, `Unknown type hint: ${ typeHint }`);
        }
    }

    _parseFields(def, keyword) {
        const match = rex.matchFields(keyword, def);
        assert(match, `Invalid ${ keyword } definition format.`);
        const defBody = {};
        for (const part of match.parts) {
            const fieldDecl = part.trim();
            if (fieldDecl) {
                const decl = this.parser._parseDeclaration({
                    def: part,
                    title: 'field',
                    isInterface: false
                });
                defBody[decl.name] = decl.type;
            }
        }
        return {
            name: match.name,
            defBody
        };
    }

    _parseArray(def) {
        const match = rex.matchArrayDeclaration(def);
        assert(match, `Invalid array definition format.`);

        return match;
    }
}

module.exports = RefTypeParser;