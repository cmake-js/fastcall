'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var StructType = require('./ref-libs/struct');
var RefTypeDefinition = require('./RefTypeDefinition');

var FastStruct = function (_RefTypeDefinition) {
    _inherits(FastStruct, _RefTypeDefinition);

    function FastStruct(library, def) {
        _classCallCheck(this, FastStruct);

        return _possibleConstructorReturn(this, (FastStruct.__proto__ || Object.getPrototypeOf(FastStruct)).call(this, {
            library: library,
            FactoryType: StructType,
            def: def,
            propertyName: 'struct'
        }));
    }

    return FastStruct;
}(RefTypeDefinition);

module.exports = FastStruct;
//# sourceMappingURL=FastStruct.js.map