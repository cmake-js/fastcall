'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const ArrayType = require('./ref-libs/array');
const RefTypeDefinition = require('./RefTypeDefinition');

class FastArray extends RefTypeDefinition {
    constructor(library, def) {
        super({
            library,
            FactoryType: ArrayType,
            def,
            propertyName: 'array'
        });
    }
}

module.exports = FastArray;