'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const ref = require('./TooTallNates/ref');

class FieldsDefinition {
    constructor(args) {
        verify(args);

        assert(_.isObject(args.library), '"library" is not an object.');
        verify(_.isString(args.propertyName), '"args.propertyName" is not a string.');
        this.library = args.library;
        this._propertyName = args.propertyName;

        this.name = _.keys(args.def)[0];
        assert(_.isString(this.name), '"def" is invalid.');
        const defBody = args.def[this.name];

        if (_.isFunction(defBody)) {
            this._type = defBody;
        }
        else if (_.isPlainObject(defBody)) {
            verify(_.isFunction(args.FactoryType), '"args.FactoryType" is not a function.');
            this._type = new args.FactoryType(defBody);
        }
        else {
            assert(false, '"def" is invalid.');
        }

        this._refType = ref.refType(this._type);
    }

    get type() {
        return this._type;
    }

    getFactory() {
        const factory = value => this.makePtr(value);
        factory[this._propertyName] = this;
        factory.type = this.type;
        return factory;
    }

    makePtr(value) {
        const propName = this._propertyName;
        if (value) {
            if (value[propName] === this) {
                return value;
            }
            if (_.isObject(value)) {
                const ptr = new this.type(value).ref();
                ptr[propName] = this;
                verify(ptr.type === this.type);
                return ptr;
            }
            if (value instanceof Buffer) {
                if (value.type === undefined) {
                    value.type = this.type;
                    value[propName] = this;
                    return value;
                }
                throw new TypeError(`Buffer is not a ${ propName } pointer.`);
            }
        }
        else if (value === null) {
            return null;
        }
        throw new TypeError(`Cannot make ${ propName } from: ` + value);
    }
}

module.exports = FieldsDefinition;