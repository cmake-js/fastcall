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
const assert = require('assert');
const verify = require('./verify');
const a = verify.a;
const ert = verify.ert;
const ref = require('./ref-libs/ref');
const Parser = require('./Parser');
const rex = require('./rex');

class RefTypeDefinition {
    constructor(library, propertyName, def) {
        a&&ert(_.isObject(library), 'Argument "library" is not an object.');
        a&&ert(_.isString(propertyName), 'Argument "propertyName" is not a string.');
        this.library = library;
        this.propertyName = propertyName;

        const parser = new Parser(library);
        const parsed = parser.parseRefType(def, propertyName);
        a&&ert(_.isObject(parsed));
        a&&ert(parsed.body);
        a&&ert(_.isFunction(parsed.factoryType));
        a&&ert(parsed.type);
        a&&ert(_.isString(parsed.name) && parsed.name.length);

        this.name = parsed.name;
        this._body = parsed.body;
        this._factoryType = parsed.factoryType;
        this._type = parsed.type;
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
            if (value instanceof Buffer) {
                return value;
            }

            if (_.isPlainObject(value) || _.isArray(value) || _.isString(value)) {
                value = new this.type(value);
            }

            if (value.buffer instanceof Buffer) {
                value = value.buffer;
            }
            else if (_.isFunction(value.ref)) {
                value = value.ref();
            }

            if (_.isObject(value)) {
                if (value.type === undefined) {
                    value.type = this.type;
                }

                if (value[propName] === undefined) {
                    value[propName] = this;
                }

                if (value[propName] === this) {
                    return value;
                }

                throw new TypeError('Buffer is not a ' + propName + ' pointer.');
            }
        }
        else if (value === null) {
            return ref.NULL;
        }
        throw new TypeError(`Cannot make ${ propName } from: ${ util.inspect(value) }`);
    }

    _makeTypeWithLength(len) {
        len = _.isString(len) ? Number.parseInt(len) : len;
        let itemType = this._body;
        let FactoryType = this._factoryType;
        assert(len > 0 && itemType && _.isFunction(FactoryType), 'Invalid array type definition.');
        return new FactoryType(itemType, len);
    }
}

module.exports = RefTypeDefinition;