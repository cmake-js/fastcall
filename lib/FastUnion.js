'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const UnionType = require('./TooTallNates/union');
const RefTypeDefinition = require('./RefTypeDefinition');

class FastUnion extends RefTypeDefinition {
    constructor(library, def) {
        super({
            library,
            FactoryType: UnionType,
            def,
            propertyName: 'union'
        });
    }
}

module.exports = FastUnion;