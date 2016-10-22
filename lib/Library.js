'use strict';
const _ = require('lodash');
const native = require('./native');
const assert = require('assert');
const Promise = require('bluebird');
const async = Promise.coroutine;
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');

const callMode = {
    sync: 1,
    async: 2
};

const defaultOptions = {
    defaultCallMode: callMode.sync
};

class Library {
    constructor(path, options) {
        this._base = new native.LibraryBase(this);

        assert(_.isString(path) && path.length, 'Argument "path" should be a non-empty string.');
        this.path = path;
        this.options = Object.freeze(_.defaults(options, defaultOptions));
        assert(this.options.defaultCallMode === callMode.sync ||
            this.options.defaultCallMode === callMode.async,
            '"options.callMode" is invalid.');
        this._pLib = null;
        this._initialized = false;
        this._released = false;
        this.functions = {};
        this.callbacks = {};
        this.interface = {};
        this.synchronize = Promise.promisify(this._base._synchronize, { context: this._base });
    }

    initialize() {
        assert(!this._released, `Library "${ this.path }" has already been released.`);
        if (this._initialized) {
            return;
        }
        this._pLib = native.loadLibrary(this.path);
        this._base.initialize();
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
        this._base.free();
        this._released = true;
        return this;
    }

    function(def) {
        return this.options.defaultCallMode === callMode.sync ?
            this.syncFunction(def) :
            this.asyncFunction(def);
    }

    syncFunction(def) {
        //this._addFunction(new Function(this, def, callMode.sync));
        return this;
    }

    asyncFunction(def) {
        //this._addFunction(new Function(this, def, callMode.async));
        return this;
    }

    callback(def) {
        //this._addCallback(new Callback(this, def));
        return this;
    }

    _addFunction(func) {
        assert(!this.functions[func.name], `Function ${ func.name } already declared.`);
        this.initialize();
        func.initialize();
        this.functions[func.name] = func;
        this.interface[func.name] = func.getFunction();
    }

    _addCallback(cb) {
        assert(!this.callbacks[cb.name], `Callback ${ cb.name } already declared.`);
        this.initialize();
        cb.initialize();
        this.callbacks[cb.name] = cb;
        this.interface[cb.name] = cb.getFactory();
    }
}

Library.callMode = callMode;

Library.find = async(function* (moduleDir, name) {
    assert(_.isString(moduleDir), 'Agument is not a string.');

    const rootDir = path.join(moduleDir, 'build');
    const libPath =
        (yield findIn(rootDir, 'Debug', name)) ||
        (yield findIn(rootDir, 'Release', name));
    if (!libPath) {
        throw new Error(`${ name } library not found.`);
    }
    return libPath;
});

module.exports = Library;

var findIn = async(function* (rootDir, subDir, name) {
    const dir = path.join(rootDir, subDir);
    let files;
    try {
        files = yield fs.readdirAsync(dir);
    }
    catch (err) {
        return null;
    }
    const rex = new RegExp(name);
    for (const file of files) {
        if (rex.test(file)) {
            return path.join(dir, file);
        }
    }
    return null;
});