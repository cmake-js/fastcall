'use strict';
const _ = require('lodash');
const verify = require('./verify');
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
        verify(scoped instanceof Scoped);
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