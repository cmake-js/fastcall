'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const util = require('util');
const FunctionDefinition = require('./FunctionDefinition');

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
        this._def = new FunctionDefinition(library, def);
        this._other = null;
        this._ptr = ptr;
        this._function = null;
    }

    get name() {
        return this._def.name;
    }

    get resultType() {
        return this._def.resultType;
    }

    get args() {
        return this._def.args;
    }

    get signature() {
        return this._def.signature;
    }

    toString() {
        return this._def.toString();
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
        this._function.function = this;
    }

    sync() {
        if (this.callMode === callMode.sync) {
            return this.getFunction();
        }
        if (!this._other) {
            this._other = new Function(this.library, this, callMode.sync, this.ptr);
            this._other.initialize();
        }
        return this._other.getFunction();
    }

    async() {
        if (this.callMode === callMode.async) {
            return this.getFunction();
        }
        if (!this._other) {
            this._other = new Function(this.library, this, callMode.async, this.ptr);
            this._other.initialize();
        }
        return this._other.getFunction();
    }

    getFunction() {
        assert(this._function);
        return this._function;
    }
}

Function.callMode = callMode;

module.exports = Function;