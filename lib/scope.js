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
const _ = require('lodash');
const verify = require('./verify');
const a = verify.a;
const ert = verify.ert;
const assert = require('assert');
const Promise = require('bluebird');

module.exports = scope;

function scope(body) {
    assert(_.isFunction(body), 'Body should be a function.');
    begin();
    try {
        const result = body(scope);
        if (result) {
            if (_.isFunction(result.then)) {
                return result
                    .then(function (asyncResult) {
                        escape(asyncResult, true);
                        end();
                        return asyncResult;
                    },
                    function (asyncError) {
                        end();
                        throw asyncError;
                    });
            }
            escape(result, true);
        }
        end();
        return result;
    }
    catch (err) {
        end();
        throw err;
    }
}

scope._add = function (scoped) {
    add(scoped);
};

scope.async = function (body) {
    assert(_.isFunction(body), 'Body should be a function.');
    return scope(Promise.coroutine(body));
};

scope.escape = function (value) {
    return escape(value);
};

scope.begin = begin;
scope.end = end;

const layers = [];

function begin() {
    layers.push(new Set());
}

function end() {
    const last = layers.pop();
    if (last) {
        for (let scoped of last.values()) {
            scoped._dispose();
        }
    }
}

function add(scoped, layer) {
    if (verify.enabled) {
        const Scoped = scope.Scoped;
        a&&ert(scoped instanceof Scoped);
    }
    const currentLayer = layer || (layers.length ? layers[layers.length - 1] : null);
    if (currentLayer) {
        currentLayer.add(scoped);
    }
}

function escape(result, propagate) {
    let currentLayer = null;
    let prevLayer = null;
    if (layers.length > 1) {
        currentLayer = layers[layers.length - 1];
        if (propagate) {
            prevLayer = layers[layers.length - 2];
        }
    }
    else if (layers.length) {
        currentLayer = layers[layers.length - 1];
    }

    if (currentLayer) {
        for (let scoped of enumScoped(result)) {
            currentLayer.delete(scoped);
            if (prevLayer) {
                prevLayer.add(scoped);
            }
        }
    }
}

function* enumScoped(result) {
    const Scoped = scope.Scoped;
    if (result instanceof Scoped) {
        yield result;
    }
    else if (_.isArray(result)) {
        for (let item of result) {
            yield* enumScoped(item);
        }
    }
    else if (result instanceof Map || result instanceof Set) {
        for (let item of result.values()) {
            yield* enumScoped(item);
        }
    }
    else if (_.isObject(result)) {
        for (let key in result) {
            if (result.hasOwnProperty(key)) {
                yield* enumScoped(result[key]);
            }
        }
    }
}