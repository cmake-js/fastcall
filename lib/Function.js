'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const dyncall = native.dyncall;
const dynload = native.dynload;
const defs = require('./defs');
const callMode = defs.callMode;
const FunctionDefinition = require('./FunctionDefinition');
const util = require('util');
const verify = require('./verify');
const ref = require('./ref');

class Function extends FunctionDefinition {
    constructor(library, def, callMode, ptr) {
        assert(_.isObject(library), '"library" is not an object.');
        assert(callMode === defs.callMode.sync || callMode === defs.callMode.async, '"callMode" is invalid: ' + callMode);
        super(library, def);
        this.callMode = callMode;
        this._ptr = ptr;
        this._vm = null;
        this._function = null;
        this._other = null;
    }

    initialize() {
        if (!this._ptr) {
            this._ptr = dynload.findSymbol(this.library._pLib, this.name);
        }
        assert(this._ptr, `Symbol "${ this.name }" not found in library "${ this.library.path }".`);
        this._vm = dyncall.newCallVM(this.library.options.vmSize);
        this._function = this._makeFunction();
    }

    release() {
        dyncall.free(this._vm);
    }

    getFunction() {
        assert(this._function, this.name + ' is not initialized.');
        return this._function;
    }

    sync() {
        if (this.callMode === defs.callMode.sync) {
            return this.getFunction();
        }
        if (!this._other) {
            this._other = new Function(this.library, this, defs.callMode.sync, this._ptr);
            this._other.initialize();
        }
        return this._other.getFunction();
    }

    async() {
        if (this.callMode === defs.callMode.async) {
            return this.getFunction();
        }
        if (!this._other) {
            this._other = new Function(this.library, this, defs.callMode.async, this._ptr);
            this._other.initialize();
        }
        return this._other.getFunction();
    }

    _makeFunction() {
        const vmArgSetters = this.args.map(arg => this._findVMSetterFunc(arg.type));
        const callerFunc = this._makeCallerFunc();

        const self = this;
        let func;
        if (this.callMode === defs.callMode.sync) {
            const vm = this._vm;            
            func = function () { 
                dyncall.setVM(vm);
                for (let i = 0, len = vmArgSetters.length; i < len; i++) {
                    vmArgSetters[i](arguments[i]);
                }
                return callerFunc();
            };
        }
        else {
            assert(false, 'TODO');
        }
        func.function = this;
        return func;
    }

    _findVMSetterFunc(type) {
        if (type.indirection > 1) {
            return dyncall.argPointer;
        }

        const name = 'arg' + this.toFastcallName(type.name);
        const func = dyncall[name];
        verify(_.isFunction(func));
        return func;
    }

    _makeCallerFunc() {
        let name;
        let isPtr = false;
        let async = false;
        if (this.resultType.indirection > 1) {
            name = 'callPointer';
            isPtr = true;
        }
        else {
            name = 'call' + this.toFastcallName(this.resultType.name);
        }
        if (this.callMode === defs.callMode.async) {
            name += 'Async';
        }

        const func = dyncall[name];
        verify(_.isFunction(func));

        if (async) {
            if (isPtr) {
                return (callback) => {
                    const result = func(this._ptr, callback);
                    result.type = this.resultType;
                    return result;
                }
            }

            return (callback) => func(this._ptr, callback);
        }
        
        if (isPtr) {
            return () => {
                const result = func(this._ptr);
                result.type = this.resultType;
                return result;
            }
        }

        return () => func(this._ptr);
    }
}

module.exports = Function;