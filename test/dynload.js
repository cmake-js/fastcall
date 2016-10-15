'use strict';
const native = require('../lib/native');
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const Promise = require('bluebird');
const async = Promise.coroutine;

describe('native dynload interface', function () {
    let libPath = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

    it('should export an object', function () {
        assert(_.isObject(native));
    });

    it('should expose dynload methods', function () {
        assert(_.isFunction(native.loadLibrary));
        assert(_.isFunction(native.freeLibrary));
        assert(_.isFunction(native.findSymbol));
    });

    it('should load a library, and find a function pointer there', function () {
        const pLib = native.loadLibrary(libPath);
        assert(_.isBuffer(pLib));
        assert.equal(pLib.length, 0);
        const pMul = native.findSymbol(pLib, 'mul');
        assert.ok(pMul);
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
        const pLib = native.loadLibrary(libPath);
        assert(native.findSymbol(pLib, '42') === null);
        native.freeLibrary(pLib);
    });
});