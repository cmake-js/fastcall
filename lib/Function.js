'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('native');

const callMode = {
    sync: 1,
    async: 2
};

class Function extends native.FunctionBase {
    constructor(library, def, callMode, ptr) {
        super();
        assert(_.isObject(library), '"library" is not an object.');
        this.library = library;
        assert(callMode === callMode.sync || callMode === callMode.async, '"callMode" is invalid.');
        this.callMode = callMode;
        if (_.isString(def)) {
            def = parseString(def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = def.args;
        }
        if (_.isPlainObject(def)) {
            def = parseObject(def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = def.args;
        }
        else if (def instanceof Function) {
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = def.args;
        }
        else {
            throw new TypeError('Invalid function definition type.');
        }
        assert(_.isObject(this.resultType));
        assert(_.isString(this.name) && this.name.length);
        assert(_.isArray(this.args));

        this._other = null;
        this._ptr = ptr;
        this._func = super.func.bind(this);
    }

    initialize() {
        if (!this._ptr) {
            this._ptr = native.findSymbol(this.library._pLib, this.name);
            assert(this._ptr, `Symbol "${ this.name }" not found in library "${ this.library.path }".`);
        }
        super.initialize();
    }

    sync() {
        if (this.callMode === callMode.sync) {
            return this.getFunction();
        }
        if (!this._other) {
            this._other = new Function(this.library, this, callMode.sync, this.ptr);
        }
        return this._other.getFunction();
    }

    async() {
        if (this.callMode === callMode.async) {
            return this;
        }
        if (!this._other) {
            this._other = new Function(this.library, this, callMode.async, this.ptr);
        }
        return this._other;
    }

    getFunction() {
        return this._func;
    }
}

Function.callMode = callMode;

module.exports = Function;

function parseString(def) {
    let parts = /(.+)\s+(.+)\((.+)\)/.exec(def);
    assert(parts && parts.length === 4, 'Invalid function definition format.');
    const resultType = ref.coerce(parts[1]);
    const name = parts[2].trim();
    let args = parts[3].split(',');
    let i = -1;
    args = args.map(arg => {
        i++;
        const argParts = /(.+)\s+(.+)/.exec(arg);
        assert(parts && parts.length === 3, 'Invalid argument: ' + arg);
        if (argParts[2] === '*') {
            return {
                name: 'arg' + i,
                type: ref.coerce(argParts[1] + '*')
            };
        }
        return {
            name: argParts[2].trim(),
            type: ref.coerce(argParts[1])
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
    const resultType = ref.coerce(arr[0]);
    const args = [];
    if (_.isArray(arr[1])) {
        for (let i = 0; i < arr[1].length; i++) {
            args.push({
                name: 'arg' + i,
                type: ref.coerce(arr[1][i])
            });
        }
    }
}