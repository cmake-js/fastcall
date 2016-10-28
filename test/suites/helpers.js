'use strict';
const Promise = require('bluebird');
const async = Promise.coroutine;
const lib = require('../../lib');
const Library = lib.Library;
const path = require('path');

let testlib = null;

exports.findTestlib = async(function* () {
    if (!testlib) {
        try {
            testlib = yield Library.find(path.join(__dirname, '../..'), 'testlib');
        }
        catch (err) {
            testlib = yield Library.find(path.join(__dirname, '../../..'), 'testlib');
        }
    }
    return testlib;
});