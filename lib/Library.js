'use strict';
const _ = require('lodash');
const native = require('./native');
const assert = require('assert');
const Func = require('./Func');

const defaultOptions = {
    defaultCallMode: Func.callMode.sync,
    supportedCallModes: Func.callMode.sync | Func.callMode.async
};

class Library {
    constructor(path, options) {
        assert(_.isString(path) && path.length, 'Argument "path" should be a non-empty string.');
        this.path = path;
        this.options = _.defaults(options, defaultOptions);
        assert(this.options.supportedModes & this.options.defaultMode, 'Non-supported call mode cannot be the default.');
        this._mode = this.options.defaultMode;
        this._pLib = null;
        this._initialized = false;
        this._released = false;
        this._funcs = {};
        this.interface = {};
    }

    initialize() {
        assert(!this._released, `Library "${this.path}" has already been released.`);
        if (this._initialized) {
            return;
        }
        this._pLib = native.loadLibrary(this.path);
        this._initialized = true;
        return this;
    }

    release() {
        if (!this._initialized) {
            return;
        }
        if (this._released) {
            return;
        }
        native.freeLibrary(this._pLib);
        this._released = true;
        return this;
    }

    declare(def) {
        return this.options.defaultMode === Func.callMode.sync ?
            this.declareSync(def) :
            this.declareAsync(def);
    }

    declareSync(def) {
        assert(this.options.supportedModes & Func.callMode.sync, 'Sync mode is not supported.');
        _addFunc(new Func(this, def, Func.callMode.sync));
        return this;
    }

    declareAsync(def) {
        assert(this.options.supportedModes & Func.callMode.async, 'Async mode is not supported.');
        _addFunc(new Func(this, def, Func.callMode.async));
        return this;
    }

    _addFunc(func) {
        assert(!this._defs[func.name], `Function ${func.name} already declared.`);
        this.initialize();
        func.initialize();
        this._defs[func.name] = func;
        this.interface[func.name] = func.generate();
    }
}

Library.Func.callMode = Func.callMode;

module.exports = Library;