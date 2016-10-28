'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const StructType = require('./TooTallNates/ref-struct')

class FastStruct {
    constructor(library, def) {
        assert(_.isObject(library), '"library" is not an object.');
        assert(_.isObject(def), '"def" is not an object.');
        this.library = library;
        this._type = new StructType(def);
        this._refType = ref.refType(ref.types.void);
    }

    getFactory() {
        const factory = value => this.makePtr(value);
        factory.struct = this;
        return factory;
    }

    makePtr(value) {
        if (value) {
            if (value.struct === this) {
                return value;
            }
            if (_.isObject(value)) {
                const ptr = new this._type(value);
                ptr.struct = this;
                verify(ptr.type === this._refType);
                return ptr;
            }
            if (value instanceof Buffer) {
                if (value.type === undefined) {
                    value.type = this._refType;
                    value.callback = this;
                    return value;
                }
                throw new TypeError('Buffer is not a struct pointer.');
            }
        }
        else if (value === null) {
            return null;
        }
        throw new TypeError('Cannot make struct from: ' + value);
    }
}

module.exports = FastStruct;