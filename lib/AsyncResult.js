'use strict';
const _ = require('lodash');
const assert = require('assert');
const native = require('./native');
const ref = require('ref');
const util = require('util');
const verify = require('./verify');

class AsyncResult extends native.AsyncResultBase {
    constructor(func, type) {
        super(func, ref.alloc(type));

        verify(this.ptr);
        verify(this.func);
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