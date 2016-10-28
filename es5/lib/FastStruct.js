'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var StructType = require('./TooTallNates/ref-struct');

var FastStruct = function () {
    function FastStruct(library, def) {
        _classCallCheck(this, FastStruct);

        assert(_.isObject(library), '"library" is not an object.');
        assert(_.isObject(def), '"def" is not an object.');
        this.library = library;
        this._type = new StructType(def);
        this._refType = ref.refType(ref.types.void);
    }

    _createClass(FastStruct, [{
        key: 'getFactory',
        value: function getFactory() {
            var _this = this;

            var factory = function factory(value) {
                return _this.makePtr(value);
            };
            factory.struct = this;
            return factory;
        }
    }, {
        key: 'makePtr',
        value: function makePtr(value) {
            if (value) {
                if (value.struct === this) {
                    return value;
                }
                if (_.isObject(value)) {
                    var ptr = new this._type(value);
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
            } else if (value === null) {
                return null;
            }
            throw new TypeError('Cannot make struct from: ' + value);
        }
    }]);

    return FastStruct;
}();

module.exports = FastStruct;
//# sourceMappingURL=FastStruct.js.map
