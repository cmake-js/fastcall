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
const ffi = require('../../lib').ffi;
const ref = ffi.ref;
const ArrayType = ffi.ArrayType;
const UnionType = ffi.UnionType;
const StructType = ffi.StructType;
const Library = ffi.Library;
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const Promise = require('bluebird');
const async = Promise.coroutine;

describe('ffi compatibility', function () {
    let libPath = null;
    before(async(function* () {
        libPath = yield helpers.findTestlib();
    }));

    it('supports required interface', function () {
        assert(_.isObject(ffi));
        assert(_.isObject(ref));
        assert(_.isFunction(ArrayType));
        assert(_.isFunction(UnionType));
        assert(_.isFunction(StructType));
        assert(_.isFunction(Library));
    });

    describe('functions', function () {
        it('supports multiple function definition', function () {
            const lib = ffi.Library(libPath, {
                mul: [ 'int', [ 'int', 'int' ]],
                getString: [ 'char*', [] ]
            });

            assert.equal(lib.mul(21, 2), 42);
            assert.equal(ref.readCString(lib.getString()), 'world');

            lib.release();
        });

        it('supports async', function (done) {
            const lib = ffi.Library(libPath, {
                mul: [ 'int', [ 'int', 'int' ]]
            });

            lib.mul.async(21, 2, err => {
                lib.release();
                done(err);
            });
        });

        it('supports promises', async(function* () {
            const lib = ffi.Library(libPath, {
                mul: [ 'int', [ 'int', 'int' ]]
            });

            assert.equal(yield lib.mul.asyncPromise(21, 2), 42);

            lib.release();
        }));
    });

    describe('callback', function () {
        // sync
        // async
    });

    describe('array', function () {
    });

    describe('struct', function () {
    });

    describe('union', function () {
    });
});