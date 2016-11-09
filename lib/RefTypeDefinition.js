'use strict';
const _ = require('lodash');
const assert = require('assert');
const verify = require('./verify');
const ref = require('./ref-libs/ref');
const Parser = require('./Parser');

class RefTypeDefinition {
    constructor(args) {
        verify(args);

        assert(_.isObject(args.library), '"library" is not an object.');
        verify(_.isString(args.propertyName), '"args.propertyName" is not a string.');
        this.library = args.library;
        this.propertyName = args.propertyName;

        if (_.isString(args.def)) {
            const parser = new Parser(this.library);
            const parsed = parser.parseFields(args.def, args.propertyName);
            this.name = parsed.name;
            this._type = new args.FactoryType(parsed.defBody);
        }
        else {
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
        }
        this._type[this.propertyName] = this;
    }

    get type() {
        return this._type;
    }

    getFactory() {
        const factory = value => this.makePtr(value);
        factory[this.propertyName] = this;
        factory.type = this.type;
        return factory;
    }

    makePtr(value) {
        const propName = this.propertyName;
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

module.exports = RefTypeDefinition;