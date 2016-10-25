'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const native = require('./native');
const util = require('util');
const FunctionDefinition = require('./FunctionDefinition');
const ref = require('./ref');

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
        const factory = (fn) => {
            const ptr = this._makeCallbackPtr(fn);
            verify(_.isBuffer(ptr));
            verify.strictEqual(ptr.callback, this);
            return ptr;
        };
        factory.callback = this;
        return factory;
    }

    _makeCallbackPtr(value) {
        if (value.callback === this) {
            return value;
        }
        if (_.isFunction(value)) {
            const ptr = native.callback.makePtr(value);
            ptr.callback = this;
            return ptr;
        }
        if (value instanceof Buffer) {
            throw new TypeError('Buffer is not a callback pointer.');
        }
        throw new TypeError('Cannot make callback from: ' + value);
    }

    _makeExecuteMethod() {
        const processArgsFunc = this._makeProcessArgsFunc();
        const setResultFunc = this._makeSetResultFunc();
        return (argsPtr, resultPtr, func) => {
            const callArgs = new Array(this.args.length);
            processArgsFunc(callArgs);
            setResultFunc(func.apply(null, callArgs));
            return this.resultType.code;
        };
    }

    _makeProcessArgsFunc() {
        assert('TODO');
    }

    _makeSetResultFunc() {
        assert('TODO');
    }
}

module.exports = Callback;