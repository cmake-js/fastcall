'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var native = require('./native');
var assert = require('assert');
var Promise = require('bluebird');
var async = Promise.coroutine;
var fs = Promise.promisifyAll(require('fs'));
var path = require('path');
var defs = require('./defs');
var callMode = defs.callMode;
var FastFunction = require('./FastFunction');
var FastCallback = require('./FastCallback');
var FastStruct = require('./FastStruct');
var FastUnion = require('./FastUnion');
var FastArray = require('./FastArray');

var defaultOptions = {
    defaultCallMode: callMode.sync,
    vmSize: 512
};

var Library = function () {
    function Library(path, options) {
        _classCallCheck(this, Library);

        assert(_.isString(path) && path.length, 'Argument "path" should be a non-empty string.');
        this.path = path;
        this.options = Object.freeze(_.defaults(options, defaultOptions));
        assert(this.options.defaultCallMode === callMode.sync || this.options.defaultCallMode === callMode.async, '"options.callMode" is invalid.');
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

    _createClass(Library, [{
        key: 'initialize',
        value: function initialize() {
            assert(!this._released, 'Library "' + this.path + '" has already been released.');
            if (this._initialized) {
                return;
            }
            this._pLib = native.dynload.loadLibrary(this.path);
            this._loop = native.callback.newLoop();
            this._initialized = true;
            return this;
        }
    }, {
        key: 'release',
        value: function release() {
            if (!this._initialized) {
                return;
            }
            if (this._released) {
                return;
            }
            var _iteratorNormalCompletion = true;
            var _didIteratorError = false;
            var _iteratorError = undefined;

            try {
                for (var _iterator = _.values(this.functions)[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
                    var func = _step.value;

                    func.release();
                }
            } catch (err) {
                _didIteratorError = true;
                _iteratorError = err;
            } finally {
                try {
                    if (!_iteratorNormalCompletion && _iterator.return) {
                        _iterator.return();
                    }
                } finally {
                    if (_didIteratorError) {
                        throw _iteratorError;
                    }
                }
            }

            native.callback.freeLoop(this._loop);
            native.dynload.freeLibrary(this._pLib);
            this._released = true;
            return this;
        }
    }, {
        key: 'function',
        value: function _function(def) {
            return this.options.defaultCallMode === callMode.sync ? this.syncFunction(def) : this.asyncFunction(def);
        }
    }, {
        key: 'syncFunction',
        value: function syncFunction(def) {
            this._addFunction(new FastFunction(this, def, callMode.sync));
            return this;
        }
    }, {
        key: 'asyncFunction',
        value: function asyncFunction(def) {
            this._addFunction(new FastFunction(this, def, callMode.async));
            return this;
        }
    }, {
        key: 'callback',
        value: function callback(def) {
            this._addCallback(new FastCallback(this, def));
            return this;
        }
    }, {
        key: 'struct',
        value: function struct(def) {
            this._addStruct(new FastStruct(this, def));
            return this;
        }
    }, {
        key: 'union',
        value: function union(def) {
            this._addUnion(new FastUnion(this, def));
            return this;
        }
    }, {
        key: 'array',
        value: function array(def) {
            this._addArray(new FastArray(this, def));
            return this;
        }
    }, {
        key: 'findRefDeclaration',
        value: function findRefDeclaration(type) {
            assert(_.isString(type), 'Argument is not a string.');
            return this.structs[type] || this.unions[type] || this.arrays[type] || null;
        }
    }, {
        key: '_addFunction',
        value: function _addFunction(func) {
            assert(!this.functions[func.name], 'Function ' + func.name + ' already declared.');
            this.initialize();
            func.initialize();
            this.functions[func.name] = func;
            this.interface[func.name] = func.getFunction();
        }
    }, {
        key: '_addCallback',
        value: function _addCallback(cb) {
            assert(!this.callbacks[cb.name], 'Callback ' + cb.name + ' already declared.');
            this.initialize();
            cb.initialize();
            this.callbacks[cb.name] = cb;
            this.interface[cb.name] = cb.getFactory();
        }
    }, {
        key: '_addStruct',
        value: function _addStruct(struct) {
            assert(!this.structs[struct.name], 'Union ' + struct.name + ' already declared.');
            this.initialize();
            this.structs[struct.name] = struct;
            this.interface[struct.name] = struct.getFactory();
        }
    }, {
        key: '_addUnion',
        value: function _addUnion(union) {
            assert(!this.unions[union.name], 'Union ' + union.name + ' already declared.');
            this.initialize();
            this.unions[union.name] = union;
            this.interface[union.name] = union.getFactory();
        }
    }, {
        key: '_addArray',
        value: function _addArray(array) {
            assert(!this.arrays[array.name], 'Array ' + array.name + ' already declared.');
            this.initialize();
            this.arrays[array.name] = array;
            this.interface[array.name] = array.getFactory();
        }
    }], [{
        key: 'find',
        value: function find(moduleDir, name) {
            return doFind(moduleDir, name);
        }
    }, {
        key: 'callMode',
        get: function get() {
            return callMode;
        }
    }]);

    return Library;
}();

module.exports = Library;

var doFind = async(regeneratorRuntime.mark(function _callee(moduleDir, name) {
    var rootDir, libPath;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    assert(_.isString(moduleDir), 'Agument is not a string.');

                    rootDir = path.join(moduleDir, 'build');
                    _context.next = 4;
                    return findIn(rootDir, 'Debug', name);

                case 4:
                    _context.t0 = _context.sent;

                    if (_context.t0) {
                        _context.next = 9;
                        break;
                    }

                    _context.next = 8;
                    return findIn(rootDir, 'Release', name);

                case 8:
                    _context.t0 = _context.sent;

                case 9:
                    libPath = _context.t0;

                    if (libPath) {
                        _context.next = 12;
                        break;
                    }

                    throw new Error(name + ' library not found.');

                case 12:
                    return _context.abrupt('return', libPath);

                case 13:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

var findIn = async(regeneratorRuntime.mark(function _callee2(rootDir, subDir, name) {
    var dir, files, rex, _iteratorNormalCompletion2, _didIteratorError2, _iteratorError2, _iterator2, _step2, file;

    return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    dir = path.join(rootDir, subDir);
                    files = void 0;
                    _context2.prev = 2;
                    _context2.next = 5;
                    return fs.readdirAsync(dir);

                case 5:
                    files = _context2.sent;
                    _context2.next = 11;
                    break;

                case 8:
                    _context2.prev = 8;
                    _context2.t0 = _context2['catch'](2);
                    return _context2.abrupt('return', null);

                case 11:
                    rex = new RegExp(name);
                    _iteratorNormalCompletion2 = true;
                    _didIteratorError2 = false;
                    _iteratorError2 = undefined;
                    _context2.prev = 15;
                    _iterator2 = files[Symbol.iterator]();

                case 17:
                    if (_iteratorNormalCompletion2 = (_step2 = _iterator2.next()).done) {
                        _context2.next = 24;
                        break;
                    }

                    file = _step2.value;

                    if (!rex.test(file)) {
                        _context2.next = 21;
                        break;
                    }

                    return _context2.abrupt('return', path.join(dir, file));

                case 21:
                    _iteratorNormalCompletion2 = true;
                    _context2.next = 17;
                    break;

                case 24:
                    _context2.next = 30;
                    break;

                case 26:
                    _context2.prev = 26;
                    _context2.t1 = _context2['catch'](15);
                    _didIteratorError2 = true;
                    _iteratorError2 = _context2.t1;

                case 30:
                    _context2.prev = 30;
                    _context2.prev = 31;

                    if (!_iteratorNormalCompletion2 && _iterator2.return) {
                        _iterator2.return();
                    }

                case 33:
                    _context2.prev = 33;

                    if (!_didIteratorError2) {
                        _context2.next = 36;
                        break;
                    }

                    throw _iteratorError2;

                case 36:
                    return _context2.finish(33);

                case 37:
                    return _context2.finish(30);

                case 38:
                    return _context2.abrupt('return', null);

                case 39:
                case 'end':
                    return _context2.stop();
            }
        }
    }, _callee2, this, [[2, 8], [15, 26, 30, 38], [31,, 33, 37]]);
}));
//# sourceMappingURL=Library.js.map