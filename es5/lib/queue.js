'use strict';

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var Promise = require('bluebird');

var top = Promise.resolve();
var length = 0;

Object.defineProperty(exports, 'length', { get: function get() {
        return length;
    } });

exports.next = function (f) {
    verify(_.isFunction(f));

    length++;
    top = top.catch(_.noop).then(function () {
        return Promise.try(f);
    }).finally(function () {
        length--;
    });

    return top;
};
//# sourceMappingURL=queue.js.map