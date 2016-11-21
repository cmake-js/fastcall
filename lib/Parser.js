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
const ref = require('./ref-libs/ref');
const util = require('util');
const rex = require('./rex');

const IS_X64 = process.arch === 'x64';

class Parser {
    constructor(library) {
        verify(library);

        this.library = library;
    }

    parseFunctionObject(def) {
        verify(_.isPlainObject(def));

        // node-ffi format
        const keys = _.keys(def);
        assert(keys.length === 1, 'Object has invalid number of keys.');
        const name = keys[0];
        const arr = def[name];
        assert(_.isArray(arr), 'Function definition array expected.');
        assert(arr.length > 1, 'Function definition array is empty.');
        const resultType = this._makeRef(arr[0]);
        const args = [];
        if (_.isArray(arr[1])) {
            for (let i = 0; i < arr[1].length; i++) {
                args.push({
                    name: 'arg' + i,
                    type: this._makeRef(arr[1][i])
                });
            }
        }
        return { resultType, name, args };
    }

    parseFunctionString(def) {
        verify(_.isString(def));

        const match = rex.matchFunction(def);
        assert(match, 'Invalid function definition format.');
        const resultType = this._makeRef(match.resultType);
        let i = 0;
        const args = match.args.map(arg => this._parseDeclaration({
            def: arg,
            name: 'argument',
            defaultName: 'arg' + i++,
            isInterface: true
        }));
        return { 
            resultType, 
            name: match.name, 
            args 
        };
    }

    parseFields(def, keyword) {
        verify(_.isString(def));

        const match = rex.matchFields(keyword, def);
        assert(match, `Invalid ${ keyword } definition format.`);
        const defBody = {};
        for (const part of match.parts) {
            const fieldDecl = part.trim();
            if (fieldDecl) {
                const decl = this._parseDeclaration({
                    def: part,
                    name: 'declaration',
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

    parseArray(def) {
        verify(_.isString(def));

        const match = rex.matchArrayDeclaration(def);
        assert(match, `Invalid array definition format.`);

        return match;
    }

    _parseDeclaration(args) {
        let def = args.def;
        const name = args.name;
        def = def.trim();
        assert(def, `Invalid ${ name }: ${ def }`);
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
        assert(part1, `Invalid ${ name }: ${ def }`);
        if (!part2 && !args.defaultName) {
            assert(false, `${ name } declaration's name expected.`);
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
                verify(callback.type.code);
                verify(callback.type.callback === callback);
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
                        type.code = Parser.getTypeCode(type);
                    }
                    type[def.propertyName] = def;
                    return type;
                }
            }
        }
        const type = ref.coerceType(value);
        type.code = Parser.getTypeCode(type);
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

    static getTypeCode(type) {
        const indirection = _.isObject(type) ? type.indirection : 0;
        const name = _.isString(type) ? type : type.name;

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