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
const FunctionParser = require('./FunctionParser');
const RefTypeParser = require('./RefTypeParser');
const MultilineParser = require('./MultilineParser');
const refHelpers = require('./refHelpers');

class Parser {
    constructor(library) {
        a&&ert(library);

        this.library = library;
        this.functionParser = new FunctionParser(this);
        this.refTypeParser = new RefTypeParser(this);
        this.multilineParser = new MultilineParser(this);
    }

    parseFunction(def) {
        return this.functionParser.parse(def);
    }

    parseRefType(def, typeHint) {
        return this.refTypeParser.parse(def, typeHint);
    }

    parseMultiline(str, callMode) {
        return this.multilineParser.parse(str, callMode);
    }

    _parseDeclaration(args) {
        let def = args.def;
        const title = args.title;
        def = def.trim();
        assert(def, `Invalid ${ title }: ${ def }`);
        let pos = _.lastIndexOf(def, '*');
        if (pos === -1) {
            pos = _.lastIndexOf(def, ' ');
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
                    for (let i = 0; i < starCount; i++) {
                        type = ref.refType(type);
                    }
                    if (isInteface) {
                        assert(
                            type.indirection > 1 || refHelpers.isArrayType(type), 
                            'Using struct or unions by value on function interfaces is not supported.');
                    }
                    if (starCount) {
                        if (type.code === undefined) {
                            type.code = typeCode.getForType(type);
                        }
                        if (type[def.propertyName] === undefined) {
                            type[def.propertyName] = def;
                        }
                    }
                    return type;
                }
            }
        }
        const type = ref.coerceType(value);
        if (type.code === undefined) {
            type.code = typeCode.getForType(type);
        }
        this._ensureRegistered(type);
        return type;
    }

    _ensureRegistered(type) {
        let rootType = type;
        while (rootType.indirection > 1 || refHelpers.isArrayType(rootType)) {
            if (rootType.indirection > 1) {
                rootType = ref.derefType(rootType);
            }
            else {
                rootType = rootType.type;
            }
        }
        let regBy = null;
        if (refHelpers.isStructType(rootType)) {
            regBy = 'struct';
        }
        else if (refHelpers.isUnionType(rootType)) {
            regBy = 'union';
        }
        else if (refHelpers.isArrayType(rootType)) {
            regBy = 'array';
        }

        if (!regBy) {
            return;
        }

        this.library[regBy]({ [this.library.makeName(rootType.name)]: rootType });
    }

    _resolveStringTypes(defObj) {
        a&&ert(_.isObject(defObj));

        const result = {};
        _.each(defObj, (value, key) => {
            let type = defObj[key];
            if (_.isString(type)) {
                type = this._resolveStringType(type);
            }
            result[key] = type;
        });
        return result;
    }

    _resolveStringType(type) {
        a&&ert(_.isString(type));

        let match = rex.matchType(type);
        if (match) {
            type = match.name;
            let def = this.library.findRefDeclaration(type);
            if (def) {
                type = def.type;
                if (match.length) {
                    type = def._makeTypeWithLength(match.length);
                }
            }
        }
        const starCount = Parser._countStars(match.stars);
        for (let i = 0; i < starCount; i++) {
            type = ref.refType(type);
        }
        return type;
    }

    static _countStars(str) {
        let count = 0;
        for (let ch of str) {
            if (ch === '*') {
                ++count;
            }
        }
        return count;
    }
}

module.exports = Parser;