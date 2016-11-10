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
        this._FactoryType = args.FactoryType;

        if (_.isString(args.def)) {
            const parser = new Parser(this.library);
            const parsed = parser.parseFields(args.def, args.propertyName);
            this.name = parsed.name;
            this._type = new args.FactoryType(parsed.defBody);
        }
        else {
            this.name = _.keys(args.def)[0];
            assert(_.isString(this.name), '"def" is invalid.');
            let defBody = args.def[this.name];
            this._defBody = defBody;

            if (_.isFunction(defBody)) {
                this._type = defBody;
            }
            else if (_.isObject(defBody) || _.isString(defBody)) {
                verify(_.isFunction(args.FactoryType), '"args.FactoryType" is not a function.');
                if (_.isPlainObject(defBody)) {
                    defBody = this._resolveStringTypes(defBody);
                }
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

    _resolveStringTypes(defObj) {
        const result = {};
        _.each(defObj, (value, key) => {
            let type = defObj[key];
            if (_.isString(type)) {
                let match = /(\w+)(?:\[(\d+)\])?/.exec(type);
                if (match) {
                    type = match[1];
                    let def = this.library.findRefDeclaration(type);
                    if (def) {
                        type = def.type;
                        if (match[2]) {
                            let len = Number.parseInt(match[2]);
                            let itemType = def._defBody;
                            let FactoryType = def._FactoryType;
                            assert(len > 0 && itemType && _.isFunction(FactoryType),
                                'Invalid array type definition.');
                            type = new FactoryType(itemType, len);
                        }
                    }
                }
            }
            result[key] = type;
        });
        return result;
    }
}

module.exports = RefTypeDefinition;