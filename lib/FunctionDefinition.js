'use strict';
const _ = require('lodash');
const assert = require('assert');
const ref = require('./ref');
const util = require('util');

const IS_X64 = process.arch === 'x64';

class FunctionDefinition {
    constructor(library, def) {
        if (_.isString(def)) {
            def = parseString(library, def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        }
        else if (_.isPlainObject(def)) {
            def = parseObject(library, def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        }
        else if (def instanceof Function) {
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        }
        else {
            throw new TypeError('Invalid function definition type.');
        }

        assert(_.isObject(this.resultType));
        assert(_.isString(this.name) && this.name.length);
        assert(_.isArray(this.args));

        this.signature = this._makeSignature();
    }

    toString() {
        let args = this.args.map(arg => util.format('%s %s', arg.type.name, arg.name)).join(', ');
        return util.format('%s %s(%s)', this.resultType.name, this.name, args);
    }

    _makeSignature() {
        const argTypes =
            this.args
                .map(a => a.type)
                .map(t => getTypeCode(t));

        return `${argTypes})${getTypeCode(this.resultType)}`;
    }
}

module.exports = FunctionDefinition;

function parseString(library, def) {
    let parts = /^\s*([\w_][\w\d_]*\s*\**)\s*([\w_][\w\d_]*)\s*\((.*)\)\s*$/.exec(def);
    assert(parts && parts.length === 4, 'Invalid function definition format.');
    const resultType = makeRef(library, parts[1]);
    const name = parts[2].trim();
    let args = parts[3].trim();
    args = args ? args.split(',') : [];
    let i = -1;
    args = args.map(arg => {
        i++;
        arg = arg.trim();
        assert(arg, 'Invalid argument: ' + arg);
        let pos = _.lastIndexOf(arg, ' ');
        if (pos === -1) {
            pos = _.lastIndexOf(arg, '*');
        }
        if (pos === -1) {
            pos = arg.length - 1;
        }
        let part1 = arg.substr(0, pos + 1).trim();
        let part2 = arg.substr(pos + 1).trim();
        if (!part1 && part2) {
            part1 = part2;
            part2 = null;
        }
        assert(part1, 'Invalid argument: ' + arg);
        return {
            name: part2 || 'arg' + i,
            type: makeRef(library, part1)
        };
    });
    return { resultType, name, args };
}

function parseObject(library, def) {
    // node-ffi format
    const keys = _.keys(def);
    assert(keys.length === 1, 'Object has invalid number of keys.');
    const name = keys[0];
    const arr = def[name];
    assert(_.isArray(arr), 'Function definition array expected.');
    assert(arr.length > 1, 'Function definition array is empty.');
    const resultType = makeRef(library, arr[0]);
    const args = [];
    if (_.isArray(arr[1])) {
        for (let i = 0; i < arr[1].length; i++) {
            args.push({
                name: 'arg' + i,
                type: makeRef(library, arr[1][i])
            });
        }
    }
    return { resultType, name, args };
}

function makeRef(library, value) {
    if (_.isString(value)) {
        const callbackType = makeCallbackType(library, value);
        if (callbackType) {
            return callbackType;
        }
    }
    return ref.coerceType(value);
}

function makeCallbackType(library, value) {
    const callback = library.callbacks[value];
    if (callback) {
        const type = ref.ref(ref.types.void);
        type.callback = callback;
        return type;
    }
    return null;
}

function getTypeCode(type) {
    // ’Z’	const char* (pointing to C string) -- ?
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
            return getTypeCode('char');
        case 'uint8':
            return getTypeCode('uchar');
        case 'int16':
            return getTypeCode('short');
        case 'uint16':
            return getTypeCode('ushort');
        case 'int32':
            return getTypeode('int');
        case 'uint32':
            return getTypeode('uint');
        case 'int64':
            return getTypeCode('longlong');
        case 'uint64':
            return getTypeCode('ulonglong');
        case 'size_t':
            return getTypeCode('ulong');
        case 'byte':
            return getTypeCode('uint8');
        case 'void':
            return 'v';
        default:
            assert(false, 'Unknonwn type: ' + type.name);
    }
}