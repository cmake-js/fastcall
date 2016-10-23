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
const JSFunction = global.Function;

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
        if (this.callMode === defs.callMode.sync) {
            return this._makeSyncFunction();
        }
        else {
            assert(false, 'TODO');
        }
    }

    _makeSyncFunction() {
        const vmArgSetters = this.args.map(arg => this._findVMSetterFunc(arg.type));
        const funcArgs = _.range(vmArgSetters.length).map(n => 'arg' + n);
        let funcBody = 'this.setVM();';
        let i = 0;
        for (const setter of vmArgSetters) {
            funcBody += `this.dyncall.${ setter.name }(arg${ i++ });`;
        }
        funcBody += 'return this.callerFunc()';

        function Ctx(fn) {
            this.setVM = () => dyncall.setVM(fn._vm);
            this.dyncall = dyncall;
            this.callerFunc = fn._makeCallerFunc();
        }

        const innerFunc = Reflect.construct(JSFunction, funcArgs.concat([funcBody]));
        const ctx = new Ctx(this);
        const func = function () {
            return innerFunc.apply(ctx, arguments);
        };
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
        return {
            name: name,
            type: type
        };
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
                    func(this._ptr, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        result.type = this.resultType;
                        callback(null, result);
                    });
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