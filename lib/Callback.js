'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const native = require('./native');
const util = require('util');
const FunctionDefinition = require('./FunctionDefinition');
const ref = require('./ref');
const JSFunction = global.Function;

class Callback extends FunctionDefinition {
    constructor(library, def) {
        assert(_.isObject(library), '"library" is not an object.');
        super(library, def);
        this.library = library;
        this._def = new FunctionDefinition(library, def);
        this._ptrType = ref.refType(ref.types.void);
        this._processArgs = null;
        this._setResult = null;
    }

    initialize() {
        this._execute = this._makeExecuteMethod();
    }

    get execute() {
        assert(this._execute, 'Callback is not initialized.');
        return this._execute;
    }

    getFactory() {
        const factory = (fn) => this.makeCallbackPtr(fn);
        factory.callback = this;
        return factory;
    }

    makeCallbackPtr(value) {
        if (value.callback === this) {
            return value;
        }
        if (_.isFunction(value)) {
            const ptr = native.callback.makePtr(this.library._loop, this.signature, this.execute, value);
            verify(ptr.callback === this);
            return ptr;
        }
        if (value instanceof Buffer) {
            throw new TypeError('Buffer is not a callback pointer.');
        }
        throw new TypeError('Cannot make callback from: ' + value);
    }

    _makeExecuteMethod() {
        const processArgsFunc = this._makeProcessArgsFunc();
        const setResultFunc = this._findSetResultFunc();
        const resultTypeCode = this.resultType.code;
        return (argsPtr, resultPtr, func) => {
            const callArgs = new Array(this.args.length);
            processArgsFunc(argsPtr, callArgs);
            const result = func.apply(null, callArgs);
            if (resultTypeCode !== 'v') {
                setResultFunc(resultPtr, result);
            }
        };
    }

    _makeProcessArgsFunc() {
        const processArgFuncs = this.args.map(arg => this._findProcessArgFunc(arg.type));
        const funcArgs = ['argsPtr', 'callArgs'];
        let funcBody = '';
        for (let i = 0; i < processArgFuncs.length; i++) {
            funcBody += `callArgs[${ i }] = this.processArgFunc${ i }(argsPtr);`;
        }

        class Ctx {
            constructor(callback) {
                let i = 0;
                for (const processArgFunc of processArgFuncs) {
                    this['processArgFunc' + i++] = processArgFunc.func;
                }
            }
        }

        const ctx = new Ctx(this);

        let innerFunc;
        try {
            innerFunc = Reflect.construct(JSFunction, funcArgs.concat([funcBody]));
        }
        catch (err) {
            throw Error('Invalid function body: ' + funcBody);
        }
        
        const func = function () {
            return innerFunc.apply(ctx, arguments);
        };
        func.callback = this;
        return func;
    }

     _findProcessArgFunc(type) {
        return this.findFastcallFunc(native.callback, 'arg', type);
    }

    _findSetResultFunc() {
        return this.findFastcallFunc(native.callback, 'set', this.resultType);
    }
}

module.exports = Callback;