'use strict';
const _ = require('lodash');
const assert = require('assert');
const Promise = require('bluebird');
const native = require('./native');
const dyncall = native.dyncall;
const dynload = native.dynload;
const defs = require('./defs');
const callMode = defs.callMode;
const FunctionDefinition = require('./FunctionDefinition');
const util = require('util');
const verify = require('./verify');
const ref = require('./ref-libs/ref');

class FastFunction extends FunctionDefinition {
    constructor(library, def, callMode, ptr) {
        assert(_.isObject(library), '"library" is not an object.');
        assert(callMode === defs.callMode.sync || callMode === defs.callMode.async, '"callMode" is invalid: ' + callMode);
        super(library, def);
        this.callMode = callMode;
        this._ptr = ptr;
        this._vm = null;
        this._function = null;
        this._other = null;
        this._type.function = this;
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
            this._other = new FastFunction(this.library, this, defs.callMode.sync, this._ptr);
            this._other.initialize();
        }
        return this._other.getFunction();
    }

    async() {
        if (this.callMode === defs.callMode.async) {
            return this.getFunction();
        }
        if (!this._other) {
            this._other = new FastFunction(this.library, this, defs.callMode.async, this._ptr);
            this._other.initialize();
        }
        return this._other.getFunction();
    }

    _makeFunction() {
        if (this.callMode === defs.callMode.async) {
            return this._makeAsyncFunction();
        }
        return this._makeSyncFunction();
    }

    _makeSyncFunction() {
        const vmArgSetters = this.args.map(arg => this._findVMSetterFunc(arg.type));
        const funcArgs = _.range(vmArgSetters.length).map(n => 'arg' + n);
        let funcBody = 'this.setVM(this.vm);';
        for (let i = 0; i < vmArgSetters.length; i++) {
            funcBody += `this.argSetter${ i }(arg${ i });`;
        }
        funcBody += 'return this.callerFunc();';

        class Ctx {
            constructor(fn) {
                this.vm = fn._vm;
                this.setVM = dyncall.setVMAndReset;
                let i = 0;
                for (const setter of vmArgSetters) {
                    if (setter.type.indirection === 2) {
                        const specPtrDef = setter.type.callback || setter.type.struct || setter.type.union;
                        if (specPtrDef) {
                            this['argSetter' + i++] =
                                cb => setter.func(specPtrDef.makePtr(cb));
                            continue;
                        }
                    }
                    this['argSetter' + i++] = setter.func;
                }
                this.callerFunc = fn._makeCallerFunc();
            }
        }

        let innerFunc;
        try {
            const innerFuncArgs = funcArgs.concat([funcBody]);
            innerFunc = new Function(...innerFuncArgs);
        }
        catch (err) {
            throw Error('Invalid function body: ' + funcBody);
        }
        const ctx = new Ctx(this);
        const func = function () {
            return innerFunc.apply(ctx, arguments);
        };
        return this._initFunction(func);
    }

    _makeAsyncFunction() {
        const vmArgSetters = this.args.map(arg => this._findVMSetterFunc(arg.type));
        const hasPtrArg = Boolean(_(vmArgSetters).filter(setter => setter.type.indirection > 1).head());
        const funcArgs = _.range(vmArgSetters.length).map(n => 'arg' + n);
        let funcBody = hasPtrArg ? 'var ptrs = [];' : '';
        funcBody += 'this.setVM(this.vm);';
        for (let i = 0; i < vmArgSetters.length; i++) {
            const setter = vmArgSetters[i];
            if (setter.type.indirection > 1) {
                funcBody += `this.argSetter${ i }(arg${ i }, ptrs);`;
            }
            else {
                funcBody += `this.argSetter${ i }(arg${ i });`;
            }
        }
        if (hasPtrArg) {
            funcBody += 'return this.callerFunc(this.vm).finally(() => ptrs = null);';
        }
        else {
            funcBody += 'return this.callerFunc(this.vm);';
        }

        class Ctx {
            constructor(fn) {
                this.setVM = dyncall.setVM;
                let i = 0;
                for (const setter of vmArgSetters) {
                    if (setter.type.indirection > 1) {
                        this['argSetter' + i++] = (ptr, ptrs) => {
                            let _ptr;
                            const specPtrDef = setter.type.callback || setter.type.struct || setter.type.union;
                            if (setter.type.indirection === 2 && specPtrDef) {
                                _ptr = specPtrDef.makePtr(ptr);
                            }
                            else {
                                _ptr = ptr;
                            }
                            ptrs.push(_ptr);
                            setter.func(_ptr);
                        };
                    }
                    else {
                        this['argSetter' + i++] = setter.func;
                    }
                }
                this.callerFunc = Promise.promisify(fn._makeCallerFunc());
                this.vm = null;
            }
        }

        const ctx = new Ctx(this);
        const vmSize = this.library.options.vmSize;

        let innerFunc;
        try {
            innerFunc = new Function(...funcArgs.concat([funcBody]));
        }
        catch (err) {
            throw Error('Invalid function body: ' + funcBody);
        }

        const func = function () {
            ctx.vm = dyncall.newCallVM(vmSize);
            return innerFunc.apply(ctx, arguments);
        };
        return this._initFunction(func);
    }

    _initFunction(func) {
        func.function = this;
        func.type = this.type;
        const self = this;
        Object.defineProperties(func, {
            sync: {
                get: function () {
                    return self.sync();
                }
            },
            async: {
                get: function () {
                    return self.async();
                }
            }
        });
        return func;
    }

    _findVMSetterFunc(type) {
        return this.findFastcallFunc(dyncall, 'arg', type);
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
            async = true;
        }

        const func = dyncall[name];
        verify(_.isFunction(func));

        if (async) {
            if (isPtr) {
                return (vm, callback) => {
                    func(vm, this._ptr, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        result.type = ref.derefType(this.resultType);
                        callback(null, result);
                    });
                }
            }

            return (vm, callback) => func(vm, this._ptr, callback);
        }

        if (isPtr) {
            return () => {
                const result = func(this._ptr);
                result.type = ref.derefType(this.resultType);
                return result;
            }
        }

        return () => func(this._ptr);
    }
}

module.exports = FastFunction;