'use strict';

var native = require('../../lib/native');
var helpers = require('./helpers');
var assert = require('assert');
var _ = require('lodash');
var Promise = require('bluebird');
var async = Promise.coroutine;

describe('native dynload interface', function () {
    var dynload = native.dynload;
    var libPath = null;
    before(async(regeneratorRuntime.mark(function _callee() {
        return regeneratorRuntime.wrap(function _callee$(_context) {
            while (1) {
                switch (_context.prev = _context.next) {
                    case 0:
                        _context.next = 2;
                        return helpers.findTestlib();

                    case 2:
                        libPath = _context.sent;

                    case 3:
                    case 'end':
                        return _context.stop();
                }
            }
        }, _callee, this);
    })));

    it('should export an object', function () {
        assert(_.isObject(native));
        assert(_.isObject(dynload));
    });

    it('should expose dynload methods', function () {
        assert(_.isFunction(dynload.loadLibrary));
        assert(_.isFunction(dynload.freeLibrary));
        assert(_.isFunction(dynload.findSymbol));
    });

    it('should load a library, and find a function pointer there', function () {
        var pLib = dynload.loadLibrary(libPath);
        assert(_.isBuffer(pLib));
        assert.equal(pLib.length, 0);
        var pMul = dynload.findSymbol(pLib, 'mul');
        assert.ok(pMul);
        assert(_.isBuffer(pMul));
        assert.equal(pMul.length, 0);
        dynload.freeLibrary(pLib);
    });

    it('should throw, when library doesn\'t exsist', function () {
        assert.throws(function () {
            return dynload.loadLibrary('bubukittyfuck');
        });
    });

    it('should throw, when loadLibrary\'s first argument missing', function () {
        assert.throws(function () {
            return dynload.loadLibrary();
        });
    });

    it('should return null when function not found', function () {
        var pLib = dynload.loadLibrary(libPath);
        assert(dynload.findSymbol(pLib, '42') === null);
        dynload.freeLibrary(pLib);
    });
});
//# sourceMappingURL=dynload.js.map