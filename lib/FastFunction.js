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
const Promise = require('bluebird');
const native = require('./native');
const dyncall = native.dyncall;
const dynload = native.dynload;
const defs = require('./defs');
const callMode = defs.callMode;
const FunctionDefinition = require('./FunctionDefinition');
const util = require('util');
const verify = require('./verify');
const a = verify.a;
const ert = verify.ert;
const ref = require('./ref-libs/ref');
const refHelpers = require('./refHelpers');

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
        if (this.library.synchronized) {
            funcBody += 'this.library._lock();';
            funcBody += 'try {';
            funcBody += 'return this.callerFunc();';
            funcBody += '}';
            funcBody += 'finally {';
            funcBody += 'this.library._unlock();';
            funcBody += '}';
        }
        else {
            if (this.library.queued) {
                funcBody += 'this.library._assertQueueEmpty();';
            }
            funcBody += 'return this.callerFunc();';
        }

        class Ctx {
            constructor(fn) {
                this.library = fn.library;
                this.vm = fn._vm;
                this.setVM = dyncall.setVMAndReset;
                let i = 0;
                for (const setter of vmArgSetters) {
                    const specPtrDef = setter.type.callback ||
                            setter.type.struct ||
                            setter.type.union ||
                            setter.type.array;
                    if (specPtrDef) {
                        this['argSetter' + i++] = value => {
                            setter.func(specPtrDef.makePtr(value));
                        };
                    }
                    else if (refHelpers.isArrayType(setter.type)) {
                        this['argSetter' + i++] = value => {
                            setter.func(FastFunction._makeArrayPtr(value));
                        };
                    }
                    else if (refHelpers.isFunctionType(setter.type)) {
                        this['argSetter' + i++] = value => {
                            setter.func(fn._makeCallbackPtr(value));
                        };
                    }
                    else if (refHelpers.isStringType(setter.type)) {
                        this['argSetter' + i++] = value => {
                            setter.func(fn._makeStringPtr(value));
                        };
                    }
                    else {
                        this['argSetter' + i++] = setter.func;
                    }
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
        const hasPtrArg = Boolean(_(vmArgSetters).filter(setter => refHelpers.isPointerType(setter.type)).head());
        const funcArgs = _.range(vmArgSetters.length).map(n => 'arg' + n);
        let funcBody = hasPtrArg ? 'var ptrs = [];' : '';
        funcBody += 'var myVM = this.vm;';
        funcBody += 'this.setVM(myVM);';
        for (let i = 0; i < vmArgSetters.length; i++) {
            const setter = vmArgSetters[i];
            if (refHelpers.isPointerType(setter.type)) {
                funcBody += `this.argSetter${ i }(arg${ i }, ptrs);`;
            }
            else {
                funcBody += `this.argSetter${ i }(arg${ i });`;
            }
        }

        let finallyCode = '{';
        if (this.library.synchronized) {
            finallyCode += 'this.library._unlock();';
            funcBody += 'this.library._lock();';
        }
        if (hasPtrArg) {
            finallyCode += 'ptrs = null;';
        }
        finallyCode += '}';

        const f = `return this.callerFunc(myVM).finally(() => ${ finallyCode });`;
        if (this.library.queued) {
            funcBody += `return this.library._enqueue(() => { ${ f } });`;
        }
        else {
            funcBody += f;
        }

        class Ctx {
            constructor(fn) {
                this.library = fn.library;
                this.setVM = dyncall.setVM;
                this.free = dyncall.free;
                let i = 0;
                for (const setter of vmArgSetters) {
                    if (refHelpers.isPointerType(setter.type)) {
                        const specPtrDef = setter.type.callback ||
                                setter.type.struct ||
                                setter.type.union ||
                                setter.type.array;
                        if (specPtrDef) {
                            this['argSetter' + i++] = (value, ptrs) => {
                                const ptr = specPtrDef.makePtr(value);
                                ptrs.push(ptr);
                                setter.func(ptr);
                            };
                        }
                        else if (refHelpers.isArrayType(setter.type)) {
                            this['argSetter' + i++] = (value, ptrs) => {
                                const ptr = FastFunction._makeArrayPtr(value);
                                ptrs.push(ptr);
                                setter.func(ptr);
                            };
                        }
                        else if (refHelpers.isFunctionType(setter.type)) {
                            this['argSetter' + i++] = (value, ptrs) => {
                                const ptr = fn._makeCallbackPtr(value);
                                ptrs.push(ptr);
                                setter.func(ptr);
                            };
                        }
                        else if (refHelpers.isStringType(setter.type)) {
                            this['argSetter' + i++] = (value, ptrs) => {
                                const ptr = fn._makeStringPtr(value);
                                ptrs.push(ptr);
                                setter.func(ptr);
                            };
                        }
                        else {
                            this['argSetter' + i++] = (value, ptrs) => {
                                ptrs.push(value);
                                setter.func(value);
                            };
                        }
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
        a&&ert(_.isFunction(func));

        if (async) {
            if (isPtr) {
                const resultDerefType = ref.derefType(this.resultType);
                return (vm, callback) => {
                    func(vm, this._ptr, (err, result) => {
                        if (err) {
                            return callback(err);
                        }
                        result.type = resultDerefType;
                        callback(null, result);
                    });
                };
            }

            return (vm, callback) => func(vm, this._ptr, callback);
        }

        if (isPtr) {
            const resultDerefType = ref.derefType(this.resultType);
            return () => {
                const result = func(this._ptr);
                result.type = resultDerefType;
                return result;
            };
        }

        return () => func(this._ptr);
    }

    static _makeArrayPtr(value) {
        if (value === null) {
            return null;
        }
        if (value.buffer) {
            return value.buffer;
        }
        assert(value instanceof Buffer, 'Argument is not a Buffer.');
        return value;
    }

    _makeCallbackPtr(value) {
        if (value === null) {
            return null;
        }
        if (value._makePtr) {
            return value._makePtr(this.library);
        }
        assert(value instanceof Buffer, 'Argument is not a Buffer.');
        return value;
    }

    _makeStringPtr(value) {
        if (value === null) {
            return null;
        }
        if (_.isString(value)) {
            return native.makeStringBuffer(value);
        }
        assert(value instanceof Buffer, 'Argument is not a Buffer.');
        return value;
    }
}

module.exports = FastFunction;