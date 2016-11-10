'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const ref = require('./ref-libs/ref');
const util = require('util');

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

        let parts = /^\s*([\w_][\w\d_]*\s*\**)\s*([\w_][\w\d_]*)\s*\((.*)\)\s*$/.exec(def);
        assert(parts && parts.length === 4, 'Invalid function definition format.');
        const resultType = this._makeRef(parts[1]);
        const name = parts[2].trim();
        let args = parts[3].trim();
        args = args ? args.split(',') : [];
        let i = 0;
        args = args.map(arg => this._parseDeclaration({
            def: arg,
            name: 'argument',
            defaultName: 'arg' + i++,
            isInterface: true
        }));
        return { resultType, name, args };
    }

    parseFields(def, keyword) {
        verify(_.isString(def));

        const rex = new RegExp(keyword + '\\s*(\\w+)\\s*{(.*)}');
        const match = rex.exec(def);
        assert(match && match.length === 3, `Invalid ${ keyword } definition format.`);
        const name = match[1];
        const content = match[2];
        const parts = content.split(';');
        const defBody = {};
        for (const part of parts) {
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

        return { name, defBody };
    }

    parseArray(def) {
        verify(_.isString(def));

        const match = /(\w+)\s*\[\s*\]\s*(\w+)/.exec(def);
        assert(match && match.length === 3, `Invalid array definition format.`);

        return { name: match[2], defBody: match[1] };
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
            const nameMatch = /((\w+)\s*(?:\[\s*(\d+)\s*\])?)([\s\*]*)/.exec(value);
            if (nameMatch && nameMatch.length === 5) {
                const name = nameMatch[2];
                const def = this.library.structs[name] || 
                    this.library.unions[name] ||
                    this.library.arrays[name];
                if (def) {
                    let type = def.type;
                    if (nameMatch[3]) {
                        type = def._makeTypeWithLength(nameMatch[3]);
                    }
                    const starCount = Parser._countStars(nameMatch[4]);
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
        let regTo = null;
        let regBy = null;
        const typeStr = String(rootType);
        if (typeStr === '[StructType]') {
            regTo = this.library.structs;
            regBy = 'struct';
        }
        else if (typeStr === '[UnionType]') {
            regTo = this.library.unions;
            regBy = 'union';
        }
        else if (typeStr === '[ArrayType]') {
            regTo = this.library.arrays;
            regBy = 'array';
        }

        if (!regTo) {
            return;
        }

        let i = 0;
        let name = makeName(i);
        while (regTo[name]) {
            name = makeName(++i);
        }

        this.library[regBy]({ [name]: rootType });

        function makeName(i) {
            let iStr = String(i);
            if (iStr.length === 0) {
                iStr = '0' + iStr;
            }
            return rootType.name + iStr;
        }
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