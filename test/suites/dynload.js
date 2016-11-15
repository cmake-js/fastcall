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
const native = require('../../lib/native');
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const Promise = require('bluebird');
const async = Promise.coroutine;

describe('native dynload interface', function () {
    const dynload = native.dynload;
    let libPath = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

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
        const pLib = dynload.loadLibrary(libPath);
        assert(_.isBuffer(pLib));
        assert.equal(pLib.length, 0);
        const pMul = dynload.findSymbol(pLib, 'mul');
        assert.ok(pMul);
        assert(_.isBuffer(pMul));
        assert.equal(pMul.length, 0);
        dynload.freeLibrary(pLib);
    });

    it('should throw, when library doesn\'t exsist', function () {
        assert.throws(() => dynload.loadLibrary('bubukittyfuck'));
    });

    it('should throw, when loadLibrary\'s first argument missing', function () {
        assert.throws(() => dynload.loadLibrary());
    });

    it('should return null when function not found', function () {
        const pLib = dynload.loadLibrary(libPath);
        assert(dynload.findSymbol(pLib, '42') === null);
        dynload.freeLibrary(pLib);
    });
});