'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const ArrayType = require('./ref-libs/array');
const RefTypeDefinition = require('./RefTypeDefinition');
const Parser = require('./Parser');

class FastArray extends RefTypeDefinition {
    constructor(library, def) {
        super({
            library,
            FactoryType: ArrayType,
            def,
            propertyName: 'array'
        });
    }

    _parse(str) {
        const parser = new Parser(this.library);
        return parser.parseArray(str);
    }
}

module.exports = FastArray;