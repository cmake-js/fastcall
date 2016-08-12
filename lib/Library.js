'use strict';
const _ = require('lodash');
const native = require('./native');
const assert = require('assert');
const LibraryInterface = require('./LibraryInterface');

const modes = {
    sync: 1,
    async: 2
};

const defaultOptions = {
    defaultMode: modes.sync,
    supportedModes: modes.sync | modes.async
};

class Library {
    constructor(path, options) {
        assert(_.isString(path) && path.length, 'Argument "path" should be a non-empty string.');
        this.path = path;
        this.options = _.defaults(options, defaultOptions);
        assert(this.options.supportedModes & this.options.defaultMode, 'Non-supported mode cannot be the default.');
        this._mode = this.options.defaultMode;
        this._pLib = null;
        this._initialized = false;
        this._defs = {};
        this.interface = {};
    }

    initialize() {
        if (this._initialized) {
            return;
        }
        if (!_.size(this._defs)) {
            throw new Error('Library interface is not defined.');
        }
        this._pLib = native.loadLibrary(this.path);
        this.interface = new LibraryInterface(this);
        this._initialized = true;
        return this;
    }

    release() {
        if (!this._initialized) {
            return;
        }
        this.interface.free();
        native.freeLibrary(this._pLib);
        this._initialized = false;
        return this;
    }

    declare(def) {
        return this.options.defaultMode === modes.sync ?
            this.declareSync(def) :
            this.declareAsync(def);
    }

    declareSync(def) {
        assert(this.options.supportedModes & modes.sync, 'Sync mode is not supported.');
        // ...
        return this;
    }

    declareAsync(def) {
        assert(this.options.supportedModes & modes.async, 'Async mode is not supported.');
        // ...
        return this;
    }
}

Library.modes = modes;

module.exports = Library;