'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const ref = require('ref');
const util = require('util');

const callMode = {
    sync: 1,
    async: 2
};

class Function extends native.FunctionBase {
    constructor(library, def, _callMode, ptr) {
        super();
        assert(_.isObject(library), '"library" is not an object.');
        this.library = library;
        assert(_callMode === callMode.sync || _callMode === callMode.async, '"_callMode" is invalid: ' + _callMode);
        this.callMode = _callMode;
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

        this._other = null;
        this._ptr = ptr;
        this._function = null;
    }

    initialize() {
        if (!this._ptr) {
            this._ptr = native.findSymbol(this.library._pLib, this.name);
            assert(this._ptr, `Symbol "${ this.name }" not found in library "${ this.library.path }".`);
        }
        super.initialize();
        const func = super.call;
        assert(_.isFunction(func));
        this._function = func.bind(this);
        this._function.declaration = this.toString();
        this._function.functionName = this.name;
        this._function.resultType = this.resultType;
        this._function.args = this.args;
    }

    sync() {
        if (this.callMode === callMode.sync) {
            return this.getFunction();
        }
        if (!this._other) {
            this.library._verifyCallModeSupport(callMode.sync);
            this._other = new Function(this.library, this, callMode.sync, this.ptr);
        }
        return this._other.getFunction();
    }

    async() {
        if (this.callMode === callMode.async) {
            return this;
        }
        if (!this._other) {
            this.library._verifyCallModeSupport(callMode.async);
            this._other = new Function(this.library, this, callMode.async, this.ptr);
        }
        return this._other;
    }

    getFunction() {
        assert(this._function);
        return this._function;
    }

    toString() {
        let args = this.args.map(arg => util.format('%s %s', arg.type.name, arg.name)).join(', ');
        return util.format('%s %s(%s)', this.resultType.name, this.name, args);
    }
}

Function.callMode = callMode;

module.exports = Function;

function parseString(def) {
    let parts = /(.+)\s+(.+)\((.+)\)/.exec(def);
    assert(parts && parts.length === 4, 'Invalid function definition format.');
    const resultType = ref.coerceType(parts[1]);
    const name = parts[2].trim();
    let args = parts[3].split(',');
    let i = -1;
    args = args.map(arg => {
        i++;
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