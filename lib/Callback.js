'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const util = require('util');
const FunctionDefinition = require('./FunctionDefinition');
const ref = require('./ref');

class Callback {
    constructor(library, def) {
        this._base = new native.CallbackBase(this);

        assert(_.isObject(library), '"library" is not an object.');
        this.library = library;
        this._def = new FunctionDefinition(library, def);
        this._ptrType = ref.refType(ref.types.void);
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
        this._base.initialize();
    }

    getFactory() {
        const factory = (fn) => {
            const ptr = this._base.factory(fn);
            assert(_.isBuffer(ptr));
            assert(_.isBuffer(ptr.userData));
            assert.strictEqual(ptr.callback, this);
            return ptr;
        };
        factory.callback = this;
        return factory;
    }
}

module.exports = Callback;