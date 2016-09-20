'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const util = require('util');
const FunctionDefinition = require('./FunctionDefinition');
const ref = require('./ref');

class Callback extends native.CallbackBase {
    constructor(library, def) {
        super();
        assert(_.isObject(library), '"library" is not an object.');
        this.library = library;
        this._def = new FunctionDefinition(library, def);
        this._ptrType = ref.ref(ref.types.void);
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

    toString() {
        return this._def.toString();
    }

    factory() {
        return fn => {
            const ptr = super.factory(fn);
            assert(_.isBuffer(ptr));
            assert(_.isBuffer(ptr.userData));
            ptr.declaration = this.toString();
            ptr.callbackName = this.name;
            ptr.resultType = this.resultType;
            ptr.args = this.args;
            ptr.callback = this;
            return ptr;
        };
    }
}

module.exports = Callback;