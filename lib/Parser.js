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
const rex = require('./rex');
const typeCode = require('./typeCode');
const splitter = require('./splitter');
const FunctionParser = require('./FunctionParser');
const RefTypeParser = require('./RefTypeParser');

class Parser {
    constructor(library) {
        a&&ert(library);

        this.library = library;
        this.functionParser = new FunctionParser(this);
        this.refTypeParser = new RefTypeParser(this);
    }

    parseFunction(def) {
        return this.functionParser.parse(def);
    }

    parseFields(def, keyword) {
        return this.refTypeParser.parseFields(def, keyword);
    }

    parseArray(def) {
        return this.refTypeParser.parseArray(def);
    }

    _parseDeclaration(args) {
        let def = args.def;
        const title = args.title;
        def = def.trim();
        assert(def, `Invalid ${ title }: ${ def }`);
        let pos = _.lastIndexOf(def, ' ');
        if (pos === -1) {
            pos = _.lastIndexOf(def, '*');
        }
        if (pos === -1) {
            pos = def.length - 1;
        }
        let part1 = def.substr(0, pos + 1).trim();
        let part2 = def.substr(pos + 1).trim();
        if (!part1 && part2) {
            part1 = part2;
            part2 = null;
        }
        assert(part1, `Invalid ${ title }: ${ def }`);
        if (!part2 && !args.defaultName) {
            assert(false, `${ title } declaration's name expected.`);
        }
        return {
            name: part2 || args.defaultName,
            type: this._makeRef(part1, args.isInterface)
        };
    }

    _makeRef(value, isInteface) {
        if (isInteface === undefined) {
            isInteface = true;
        }
        if (_.isString(value)) {
            const callback = this.library.callbacks[value];
            if (callback) {
                a&&ert(callback.type.code);
                a&&ert(callback.type.callback === callback);
                return callback.type;
            }
            const match = rex.matchType(value);
            if (match) {
                const name = match.name;
                const def = this.library.structs[name] || 
                    this.library.unions[name] ||
                    this.library.arrays[name];
                if (def) {
                    let type = def.type;
                    if (match.length) {
                        type = def._makeTypeWithLength(match.length);
                    }
                    const starCount = Parser._countStars(match.stars);
                    if (isInteface) {
                        assert(starCount, 'Using struct or unions by value on function interfaces is not supported.');
                    }
                    for (let i = 0; i < starCount; i++) {
                        type = ref.refType(type);
                    }
                    if (starCount) {
                        type.code = typeCode.getForType(type);
                    }
                    type[def.propertyName] = def;
                    return type;
                }
            }
        }
        const type = ref.coerceType(value);
        type.code = typeCode.getForType(type);
        this._ensureRegistered(type);
        return type;
    }

    _ensureRegistered(type) {
        let rootType = type;
        while (rootType.indirection > 1) {
            rootType = ref.derefType(rootType);
        }
        let regBy = null;
        const typeStr = String(rootType);
        if (typeStr === '[StructType]') {
            regBy = 'struct';
        }
        else if (typeStr === '[UnionType]') {
            regBy = 'union';
        }
        else if (typeStr === '[ArrayType]') {
            regBy = 'array';
        }

        if (!regBy) {
            return;
        }

        this.library[regBy]({ [this.library.makeName(rootType.name)]: rootType });
    }

    static _countStars(def) {
        let count = 0;
        for (let ch of def) {
            if (ch === '*') {
                ++count;
            }
        }
        return count;
    }
}

module.exports = Parser;