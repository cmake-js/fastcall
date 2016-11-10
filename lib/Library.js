'use strict';
const _ = require('lodash');
const native = require('./native');
const assert = require('assert');
const Promise = require('bluebird');
const async = Promise.coroutine;
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const defs = require('./defs');
const callMode = defs.callMode;
const FastFunction = require('./FastFunction');
const FastCallback = require('./FastCallback');
const FastStruct = require('./FastStruct');
const FastUnion = require('./FastUnion');
const FastArray = require('./FastArray');

const defaultOptions = {
    defaultCallMode: callMode.sync,
    vmSize: 512
};

class Library {
    constructor(path, options) {
        assert(_.isString(path) && path.length, 'Argument "path" should be a non-empty string.');
        this.path = path;
        this.options = Object.freeze(_.defaults(options, defaultOptions));
        assert(this.options.defaultCallMode === callMode.sync ||
            this.options.defaultCallMode === callMode.async,
            '"options.callMode" is invalid.');
        this._pLib = null;
        this._initialized = false;
        this._released = false;
        this._loop = null;
        this.functions = {};
        this.callbacks = {};
        this.structs = {};
        this.unions = {};
        this.arrays = {};
        this.interface = {};
    }

    initialize() {
        assert(!this._released, `Library "${ this.path }" has already been released.`);
        if (this._initialized) {
            return;
        }
        this._pLib = native.dynload.loadLibrary(this.path);
        this._loop = native.callback.newLoop();
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
        for (const func of _.values(this.functions)) {
            func.release();
        }
        native.callback.freeLoop(this._loop);
        native.dynload.freeLibrary(this._pLib);
        this._released = true;
        return this;
    }

    function(def) {
        return this.options.defaultCallMode === callMode.sync ?
            this.syncFunction(def) :
            this.asyncFunction(def);
    }

    syncFunction(def) {
        this._addFunction(new FastFunction(this, def, callMode.sync));
        return this;
    }

    asyncFunction(def) {
        this._addFunction(new FastFunction(this, def, callMode.async));
        return this;
    }

    callback(def) {
        this._addCallback(new FastCallback(this, def));
        return this;
    }

    struct(def) {
        this._addStruct(new FastStruct(this, def));
        return this;
    }

    union(def) {
        this._addUnion(new FastUnion(this, def));
        return this;
    }

    array(def) {
        this._addArray(new FastArray(this, def));
        return this;
    }

    findRefDeclaration(type) {
        assert(_.isString(type), 'Argument is not a string.');
        return this.structs[type] || this.unions[type] || this.arrays[type] || null;
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

    _addStruct(struct) {
        assert(!this.structs[struct.name], `Union ${ struct.name } already declared.`);
        this.initialize();
        this.structs[struct.name] = struct;
        this.interface[struct.name] = struct.getFactory();
    }

    _addUnion(union) {
        assert(!this.unions[union.name], `Union ${ union.name } already declared.`);
        this.initialize();
        this.unions[union.name] = union;
        this.interface[union.name] = union.getFactory();
    }

    _addArray(array) {
        assert(!this.arrays[array.name], `Array ${ array.name } already declared.`);
        this.initialize();
        this.arrays[array.name] = array;
        this.interface[array.name] = array.getFactory();
    }

    static get callMode() {
        return callMode;
    }

    static find(moduleDir, name) {
        return doFind(moduleDir, name);
    }
}

module.exports = Library;

var doFind = async(function* (moduleDir, name) {
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