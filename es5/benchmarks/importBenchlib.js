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

var Promise = require('bluebird');
var async = Promise.coroutine;
var fastcall = require('../lib');
var Library = fastcall.Library;
var path = require('path');
var ffi = require('ffi');

var ffiLib = null;
var fastcallLib = null;

exports.ffiWay = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var libPath;
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    if (!(ffiLib === null)) {
                        _context.next = 6;
                        break;
                    }

                    _context.next = 3;
                    return findLib();

                case 3:
                    libPath = _context.sent;

                    ffiLib = ffi.Library(libPath, {
                        addNumbersExp: ['double', ['float', 'int']],
                        concatExp: ['void', ['char*', 'char*', 'char*', 'uint']],
                        makeIntExp: ['int', ['float', 'double', 'void*', 'void*']]
                    });
                    ffiLib.TMakeIntFunc = function (f) {
                        return ffi.Callback('int', ['float', 'double', 'void*'], f);
                    };

                case 6:
                    return _context.abrupt('return', ffiLib);

                case 7:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this);
}));

exports.fastcallWay = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var libPath;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
            switch (_context2.prev = _context2.next) {
                case 0:
                    if (!(fastcallLib === null)) {
                        _context2.next = 5;
                        break;
                    }

                    _context2.next = 3;
                    return findLib();

                case 3:
                    libPath = _context2.sent;

                    fastcallLib = new Library(libPath).callback('int TMakeIntFunc(float, double, void*)').function('double measureNativeNumberSyncTest(uint iterations)').function('double measureNativeStringSyncTest(uint iterations)').function('double measureNativeCallbackSyncTest(uint iterations)').function('double measureNativeNumberAsyncTest(uint iterations)').function('double measureNativeStringAsyncTest(uint iterations)').function('double measureNativeCallbackAsyncTest(uint iterations)').function('double addNumbersExp(float floatValue, int intValue)').function('void concatExp(char* str1, char* str2, char* result, uint resultSize)').function('int makeIntExp(float floatValue, double doubleValue, TMakeIntFunc func, void* context)');

                case 5:
                    return _context2.abrupt('return', fastcallLib);

                case 6:
                case 'end':
                    return _context2.stop();
            }
        }
    }, _callee2, this);
}));

exports.close = function () {
    if (fastcallLib) {
        fastcallLib.release();
        fastcallLib = null;
    }
};

var findLib = async( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var libPath;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
            switch (_context3.prev = _context3.next) {
                case 0:
                    libPath = void 0;
                    _context3.prev = 1;
                    _context3.next = 4;
                    return Library.find(path.join(__dirname, '..'), 'benchlib');

                case 4:
                    libPath = _context3.sent;
                    _context3.next = 12;
                    break;

                case 7:
                    _context3.prev = 7;
                    _context3.t0 = _context3['catch'](1);
                    _context3.next = 11;
                    return Library.find(path.join(__dirname, '../..'), 'benchlib');

                case 11:
                    libPath = _context3.sent;

                case 12:
                    return _context3.abrupt('return', libPath);

                case 13:
                case 'end':
                    return _context3.stop();
            }
        }
    }, _callee3, this, [[1, 7]]);
}));
//# sourceMappingURL=importBenchlib.js.map