'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const util = require('util');
const FunctionDefinition = require('./FunctionDefinition');

class Callback extends native.CallbackBase {
    constructor(library, def) {
        super();
        assert(_.isObject(library), '"library" is not an object.');
        this.library = library;
        this._def = new FunctionDefinition(library, def);
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
            assert(_.isBuffer(ptr.data));
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