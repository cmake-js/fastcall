'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const ref = require('./ref');
const util = require('util');
const verify = require('./verify');
const Promise = require('bluebird');

class AsyncResult {
    constructor(func, type) {
        this.func = func;
        this.ptr = ref.alloc(type);
        this._base = new native.AsyncResultBase(this);
    }

    get type() {
        return this.ptr.type;
    }

    get library() {
        return this.func.library;
    }

    get value() {
        return ref.deref(this.ptr);
    }

    get() {
        return this.library.synchronize().then(() => this.value);
    }
}

module.exports = AsyncResult;