'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const Promise = require('bluebird');

let top = Promise.resolve();
let length = 0;

Object.defineProperty(exports, 'length', { get: () => length });

exports.next = function (f) {
    verify(_.isFunction(f));

    length++;        
    top = top
    .catch(_.noop)
    .then(() => {
        return Promise.try(f);
    })
    .finally(() => {
        length--;
    });

    return top;
}