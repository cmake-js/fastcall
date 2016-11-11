'use strict';

var Promise = require('bluebird');
var async = Promise.coroutine;
var lib = require('../../lib');
var Library = lib.Library;
var path = require('path');

var testlib = null;

exports.findTestlib = async(regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
            switch (_context.prev = _context.next) {
                case 0:
                    if (testlib) {
                        _context.next = 12;
                        break;
                    }

                    _context.prev = 1;
                    _context.next = 4;
                    return Library.find(path.join(__dirname, '../..'), 'testlib');

                case 4:
                    testlib = _context.sent;
                    _context.next = 12;
                    break;

                case 7:
                    _context.prev = 7;
                    _context.t0 = _context['catch'](1);
                    _context.next = 11;
                    return Library.find(path.join(__dirname, '../../..'), 'testlib');

                case 11:
                    testlib = _context.sent;

                case 12:
                    return _context.abrupt('return', testlib);

                case 13:
                case 'end':
                    return _context.stop();
            }
        }
    }, _callee, this, [[1, 7]]);
}));
//# sourceMappingURL=helpers.js.map