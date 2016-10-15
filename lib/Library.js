'use strict';
const _ = require('lodash');
const native = require('./native');
const assert = require('assert');
const Function = require('./Function');
const Promise = require('bluebird');
const async = Promise.coroutine;
const Callback = require('./Callback');
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');

const defaultOptions = {
    defaultCallMode: Function.callMode.sync
};

class Library extends native.LibraryBase {
    constructor(path, options) {
        super();
        assert(_.isString(path) && path.length, 'Argument "path" should be a non-empty string.');
        this.path = path;
        this.options = Object.freeze(_.defaults(options, defaultOptions));
        assert(this.options.defaultCallMode === Function.callMode.sync ||
            this.options.defaultCallMode === Function.callMode.async,
            '"options.callMode" is invalid.');
        this._pLib = null;
        this._initialized = false;
        this._released = false;
        this.functions = {};
        this.callbacks = {};
        this.interface = {};
        this.synchronize = Promise.promisify(this._synchronize, { context: this });
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

    function(def) {
        return this.options.defaultCallMode === Function.callMode.sync ?
            this.syncFunction(def) :
            this.asyncFunction(def);
    }

    syncFunction(def) {
        this._addFunction(new Function(this, def, Function.callMode.sync));
        return this;
    }

    asyncFunction(def) {
        this._addFunction(new Function(this, def, Function.callMode.async));
        return this;
    }

    callback(def) {
        this._addCallback(new Callback(this, def));
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

Library.callMode = Function.callMode;

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
    for (const file of files) {
        if (/testlib/.test(file)) {
            return path.join(dir, file);
        }
    }
    return null;
});