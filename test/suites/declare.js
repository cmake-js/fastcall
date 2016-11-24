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
const fastcall = require('../../lib');
const Library = fastcall.Library;
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const ref = fastcall.ref;
const Promise = require('bluebird');
const async = Promise.coroutine;

describe(`Library.declare()`, function () {
    let libPath = null;
    let lib = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

    afterEach(function () {
        lib.release();
    });

    const declaration = 
        'int mul( int value, int by );' +
        'int (*TMakeIntFunc)(float fv, double);' +
        'int makeInt(float , double dv, TMakeIntFunc func);' +
        'float[] TFloats;' +
        'struct TStuff { TFloats more; };' +
        'union T42 { int v1; double v2 };'

    describe('sync', function () {
        it('should declare stuff as sync by default', function () {
            lib = new Library(libPath);
            lib.declare(declaration);
            testSyncInterface();
            testRefInterface();
        });

        it('should declare stuff as sync if options.callMode is different', function () {
            lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
            lib.declareSync(declaration);
            testSyncInterface();
            testRefInterface();
        });
    });

    describe('async', function () {
        it('should declare stuff as async by default if options.callMode is async', async(function* () {
            lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
            lib.declare(declaration);
            yield testAsyncInterface();
            testRefInterface();
        }));

        it('should declare stuff as async if options.callMode is different', async(function* () {
            lib = new Library(libPath, { defaultCallMode: Library.callMode.sync });
            lib.declareAsync(declaration);
            yield testAsyncInterface();
            testRefInterface();
        }));
    });

    function testSyncInterface() {
        assert(_.isFunction(lib.interface.mul));
        assert(_.isObject(lib.interface.mul.function));
        assert.strictEqual(lib.interface.mul.function, lib.functions.mul);
        assert.equal(lib.interface.mul.function.toString(), 'int mul(int value, int by)');

        assert.equal(lib.interface.mul(2, 2), 4);

        assert(_.isFunction(lib.interface.makeInt));
        assert(_.isObject(lib.interface.makeInt.function));
        assert.strictEqual(lib.interface.makeInt.function, lib.functions.makeInt);
        assert.equal(lib.interface.makeInt.function.toString(), 'int makeInt(float arg0, double dv, TMakeIntFunc func)');
        assert(_.isFunction(lib.interface.TMakeIntFunc));
        assert(_.isObject(lib.interface.TMakeIntFunc.callback));
        assert.strictEqual(lib.interface.TMakeIntFunc.callback, lib.callbacks.TMakeIntFunc);
        assert.equal(lib.interface.TMakeIntFunc.callback.toString(), 'int TMakeIntFunc(float fv, double arg1)');

        let result = lib.interface.makeInt(1.1, 2.2, (fv, dv) => fv + dv);
        assert.equal(result, Math.floor((1.1 + 2.2) * 2));
    }

    var testAsyncInterface = async(function* () {
        assert(_.isFunction(lib.interface.mul));
        assert(_.isObject(lib.interface.mul.function));
        assert.strictEqual(lib.interface.mul.function, lib.functions.mul);
        assert.equal(lib.interface.mul.function.toString(), 'int mul(int value, int by)');

        assert.equal(yield lib.interface.mul(2, 2), 4);

        assert(_.isFunction(lib.interface.makeInt));
        assert(_.isObject(lib.interface.makeInt.function));
        assert.strictEqual(lib.interface.makeInt.function, lib.functions.makeInt);
        assert.equal(lib.interface.makeInt.function.toString(), 'int makeInt(float arg0, double dv, TMakeIntFunc func)');
        assert(_.isFunction(lib.interface.TMakeIntFunc));
        assert(_.isObject(lib.interface.TMakeIntFunc.callback));
        assert.strictEqual(lib.interface.TMakeIntFunc.callback, lib.callbacks.TMakeIntFunc);
        assert.equal(lib.interface.TMakeIntFunc.callback.toString(), 'int TMakeIntFunc(float fv, double arg1)');

        let result = yield lib.interface.makeInt(1.1, 2.2, (fv, dv) => fv + dv);
        assert.equal(result, Math.floor((1.1 + 2.2) * 2));
    });

    function testRefInterface() {
        assert(_.isFunction(lib.interface.TFloats));
        assert(_.isObject(lib.interface.TFloats.array));
        assert.strictEqual(lib.interface.TFloats.array, lib.arrays.TFloats);
        assert.equal(lib.interface.TFloats.array.name, 'TFloats');
        let buff = lib.interface.TFloats([1, 2, 3]);
        assert(_.isBuffer(buff));
        assert.equal(buff.length, 3 * ref.types.float.size);

        assert(_.isFunction(lib.interface.TStuff));
        assert(_.isObject(lib.interface.TStuff.struct));
        assert.strictEqual(lib.interface.TStuff.struct, lib.structs.TStuff);
        assert.equal(lib.interface.TStuff.struct.name, 'TStuff');
        let rec = lib.structs.TStuff.type({ more: [1, 2, 3, 4] });
        assert.strictEqual(rec.more, rec.more);
        assert.equal(rec.more.get(0), 1);
        assert.equal(rec.more.get(1), 2);
        assert.equal(rec.more.get(2), 3);
        assert.equal(rec.more.get(3), 4);
        assert.equal(rec.more.length, 4);

        assert(_.isFunction(lib.interface.T42));
        assert(_.isObject(lib.interface.T42.union));
        assert.strictEqual(lib.interface.T42.union, lib.unions.T42);
        assert.equal(lib.interface.T42.union.name, 'T42');
        let uni = lib.unions.T42.type({ v1: 42 });
        assert.strictEqual(uni.v1, uni.v1);
        assert.equal(uni.v1, 42);
    }
});