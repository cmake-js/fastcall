/*
Copyright 2016 Gábor Mező (gabor.mezo@outlook.com)

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

'use strict';
const _ = require('lodash');
const native = require('./native');
const assert = require('assert');
const Promise = require('bluebird');
const async = Promise.coroutine;
const fs = Promise.promisifyAll(require('fs'));
const path = require('path');
const defs = require('./defs');
const FastFunction = require('./FastFunction');
const FastCallback = require('./FastCallback');
const FastStruct = require('./FastStruct');
const FastUnion = require('./FastUnion');
const FastArray = require('./FastArray');
const verify = require('./verify');
const a = verify.a;
const ert = verify.ert;
const queue = require('./queue');
const NameFactory = require('./NameFactory');
const Parser = require('./Parser');

const defaultOptions = {
    defaultCallMode: defs.callMode.sync,
    syncMode: defs.syncMode.none,
    vmSize: 512
};

class Library {
    constructor(path, options) {
        assert(_.isString(path) && path.length, 'Argument "path" should be a non-empty string.');
        this.path = path;
        this.options = Object.freeze(_.defaults(options, defaultOptions));
        assert(this.options.defaultCallMode === defs.callMode.sync ||
            this.options.defaultCallMode === defs.callMode.async,
            '"options.callMode" is invalid.');
        assert(this.options.syncMode >= defs.syncMode.none && this.options.syncMode <= defs.syncMode.queue,
            '"options.syncMode" is invalid.');
        this._pLib = null;
        this._initialized = false;
        this._released = false;
        this._loop = null;
        this._mutex = null;
        this._queue = null;
        this._nameFactory = new NameFactory();
        this.functions = {};
        this.callbacks = {};
        this.structs = {};
        this.unions = {};
        this.arrays = {};
        this.interface = {};
    }

    get synchronized() {
        return this.options.syncMode === defs.syncMode.lock;
    }

    get queued() {
        return this.options.syncMode === defs.syncMode.queue;
    }

    initialize() {
        assert(!this._released, `Library "${ this.path }" has already been released.`);
        if (this._initialized) {
            return;
        }
        this._pLib = native.dynload.loadLibrary(this.path);
        this._loop = native.callback.newLoop();
        if (this.options.syncMode === defs.syncMode.lock) {
            this._mutex = native.mutex.newMutex();
            a&&ert(this._mutex instanceof Buffer);
        }
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

    isSymbolExists(name) {
        assert(_.isString(name), 'Argument is not a string.');

        this.initialize();
        return Boolean(native.dynload.findSymbol(this._pLib, name));
    }

    declare(str) {
        return new Parser(this).parseMultiline(str, null);
    }

    declareSync(str) {
        return new Parser(this).parseMultiline(str, defs.callMode.sync);
    }

    declareAsync(str) {
        return new Parser(this).parseMultiline(str, defs.callMode.async);
    }

    function(def) {
        return this.options.defaultCallMode === defs.callMode.sync ?
            this.syncFunction(def) :
            this.asyncFunction(def);
    }

    syncFunction(def) {
        this._addFunction(new FastFunction(this, def, defs.callMode.sync));
        return this;
    }

    asyncFunction(def) {
        this._addFunction(new FastFunction(this, def, defs.callMode.async));
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

    _lock() {
        native.mutex.lock(this._mutex);
    }

    _unlock() {
        native.mutex.unlock(this._mutex);
    }

    _assertQueueEmpty() {
        assert(!queue.length, 'Calling functions synchronously is forbidden while there are asynchronous functions enqueued.');
    }

    _enqueue(f) {
        return queue.next(f);
    }

    makeName(prefix) {
        return this._nameFactory.makeName(prefix);
    }

    static get callMode() {
        return defs.callMode;
    }

    static get syncMode() {
        return defs.syncMode;
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