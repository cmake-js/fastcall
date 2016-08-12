'use strict';
const native = require('../lib/native');
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');

describe('native dynload interface', function () {
    it('should export an object', function () {
        assert(_.isObject(native));
    });

    it('should expose dynload methods', function () {
        assert(_.isFunction(native.loadLibrary));
        assert(_.isFunction(native.freeLibrary));
        assert(_.isFunction(native.findSymbol));
    });

    it('should load a library, and find a function pointer there', function () {
        const lib = helpers.findTestlib();
        const pLib = native.loadLibrary(lib);
        assert(_.isBuffer(pLib));
        assert.equal(pLib.length, 0);
        const pMul = native.findSymbol(pLib, 'mul');
        assert(!!pMul);
        assert(_.isBuffer(pMul));
        assert.equal(pMul.length, 0);
        native.freeLibrary(pLib);
    });

    it('should throw, when library doesn\'t exsist', function () {
        assert.throws(() => native.loadLibrary('bubukittyfuck'));
    });

    it('should throw, when loadLibrary\'s first argument missing', function () {
        assert.throws(() => native.loadLibrary());
    });

    it('should return null when function not found', function () {
        const lib = helpers.findTestlib();
        const pLib = native.loadLibrary(lib);
        assert(native.findSymbol(pLib, '42') === null);
        native.freeLibrary(pLib);
    });
});