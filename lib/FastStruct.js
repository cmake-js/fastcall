'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const StructType = require('./ref-libs/struct');
const RefTypeDefinition = require('./RefTypeDefinition');

class FastStruct extends RefTypeDefinition {
    constructor(library, def) {
        super({
            library,
            FactoryType: StructType,
            def,
            propertyName: 'struct'
        });
    }
}

module.exports = FastStruct;