'use strict';
const _ = require('lodash');
const assert = require('assert');
const ref = require('ref');
const util = require('util');

class FunctionDefinition {
    constructor(def) {
        if (_.isString(def)) {
            def = parseString(def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        }
        else if (_.isPlainObject(def)) {
            def = parseObject(def);
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
    }

    toString() {
        let args = this.args.map(arg => util.format('%s %s', arg.type.name, arg.name)).join(', ');
        return util.format('%s %s(%s)', this.resultType.name, this.name, args);
    }
}

module.exports = FunctionDefinition;

function parseString(def) {
    let parts = /^\s*([\w_][\w\d_]*\s*\**)\s*([\w_][\w\d_]*)\s*\((.*)\)\s*$/.exec(def);
    assert(parts && parts.length === 4, 'Invalid function definition format.');
    const resultType = ref.coerceType(parts[1]);
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
            type: ref.coerceType(part1)
        };
    });
    return { resultType, name, args };
}

function parseObject(def) {
    // node-ffi format
    const keys = _.keys(def);
    assert(keys.length === 1, 'Object has invalid number of keys.');
    const name = keys[0];
    const arr = def[name];
    assert(_.isArray(arr), 'Function definition array expected.');
    assert(arr.length > 1, 'Function definition array is empty.');
    const resultType = ref.coerceType(arr[0]);
    const args = [];
    if (_.isArray(arr[1])) {
        for (let i = 0; i < arr[1].length; i++) {
            args.push({
                name: 'arg' + i,
                type: ref.coerceType(arr[1][i])
            });
        }
    }
    return { resultType, name, args };
}