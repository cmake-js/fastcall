'use strict';
const fastcall = require('..');
const Library = fastcall.Library;
const helpers = require('./helpers');
const assert = require('assert');
const _ = require('lodash');
const ref = require('ref');

describe('Library', function () {
    describe("initialize", function () {
        describe('without options', function () {
            it('should init in sync mode as default', function () {
                const libPath = helpers.findTestlib();
                const lib = new Library(libPath);
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                }
                finally {
                    lib.free();
                }
            });
        });

        describe('with options', function () {
            it('should init in sync mode explicitly', function () {
                const libPath = helpers.findTestlib();
                const lib = new Library(libPath, { defaultCallMode: Library.callMode.sync });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.sync);
                }
                finally {
                    lib.free();
                }
            });

            it('should init in async mode explicitly', function () {
                const libPath = helpers.findTestlib();
                const lib = new Library(libPath, { defaultCallMode: Library.callMode.async });
                try {
                    assert(_.isObject(lib));
                    lib.initialize();
                    assert.equal(lib.options.defaultCallMode, Library.callMode.async);
                }
                finally {
                    lib.free();
                }
            });

            it('should throw when mode is unknown', function () {
                assert.throws(() => {
                    const libPath = helpers.findTestlib();
                    const lib = new Library(libPath, { defaultCallMode: 42 });
                });
            });

            it('should throw when mode is not supported', function () {
                const libPath = helpers.findTestlib();
                assert.throws(() => new Library(libPath, { defaultCallMode: Library.callMode.async, supportedCallModes: Library.callMode.sync }));
                assert.throws(() => new Library(libPath, { defaultCallMode: Library.callMode.sync, supportedCallModes: Library.callMode.async }));
            });
        });
    });

    describe('sync call mode (smoke test)', function () {
        const libPath = helpers.findTestlib();
        let lib = null;

        beforeEach(function () {
            lib = new Library(libPath);
        });

        afterEach(function () {
            lib.free();
            lib = null;
        });

        describe('node-ffi style declaration', function () {
            it('should invoke "mul" with "declare"', function () {
                lib.declare({
                    mul: ['int', [ref.types.int, 'int']]
                });
                testMulSync('int mul(int arg0, int arg1)');
            });

            it('should invoke "mul" with "declareSync"', function () {
                lib.declareSync({
                    mul: ['int', [ref.types.int, 'int']]
                });
                testMulSync('int mul(int arg0, int arg1)');
            });
        });

        describe('string declaration', function () {
            it('should invoke "mul" with "declare"', function () {
                // Argument name is optional:
                lib.declare('int mul(int value, int)');
                testMulSync('int mul(int value, int arg1)');
            });

            it('should invoke "mul" with "declareSync"', function () {
                // Argument name is optional:
                lib.declare('int mul(int, int by)');
                testMulSync('int mul(int arg0, int by)');
            });
        });

        function testMulSync(declaration) {
            assert(lib._funcs);
            assert(lib._funcs.mul);
            assert(lib.interface);
            assert(_.isFunction(lib.interface.mul));
            const mul = lib.interface.mul;

            // Verify metadata:
            assert.equal(mul.declaration, declaration);
            assert.equal(mul.functionName, 'mul');
            assert.equal(mul.resultType.name, 'int');
            assert.equal(mul.args.length, 2);
            assert(_.isString(mul.args[0].name));
            assert.equal(mul.args[0].type.name, 'int');
            assert(_.isString(mul.args[1].name));
            assert.equal(mul.args[1].type.name, 'int');

            // Call!
            assert.equal(mul(2, 2), 4);
            assert.equal(mul(10, 2), 20);
            assert.equal(mul(10, "3"), 30);
            assert.equal(mul(10.1, 2.1), 20);

            // Zero is the default:
            assert.equal(mul(10), 0);
            assert.equal(mul(), 0);
            assert.equal(mul("a", "b"), 0);
        }
    });
});