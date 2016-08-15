'use strict';
const _ = require('lodash');
const native = require('./native');
const assert = require('assert');
const Function = require('./Function');

const defaultOptions = {
    defaultCallMode: Function.callMode.sync,
    supportedCallModes: Function.callMode.sync | Function.callMode.async
};

class Library extends native.LibraryBase {
    constructor(path, options) {
        super();
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
        assert(!this._released, `Library "${ this.path }" has already been released.`);
        if (this._initialized) {
            return;
        }
        this._pLib = native.loadLibrary(this.path);
        super.initialize();
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
        super.free();
        this._released = true;
        return this;
    }

    declare(def) {
        return this.options.defaultMode === Function.callMode.sync ?
            this.declareSync(def) :
            this.declareAsync(def);
    }

    declareSync(def) {
        assert(this.options.supportedModes & Function.callMode.sync, 'Sync mode is not supported.');
        _addFunc(new Function(this, def, Function.callMode.sync));
        return this;
    }

    declareAsync(def) {
        assert(this.options.supportedModes & Function.callMode.async, 'Async mode is not supported.');
        _addFunc(new Function(this, def, Function.callMode.async));
        return this;
    }

    _addFunc(func) {
        assert(!this._defs[func.name], `Function ${ func.name } already declared.`);
        this.initialize();
        func.initialize();
        this._defs[func.name] = func;
        this.interface[func.name] = func.generate();
    }
}

module.exports = Library;