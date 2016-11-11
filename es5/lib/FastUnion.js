'use strict';

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var UnionType = require('./ref-libs/union');
var RefTypeDefinition = require('./RefTypeDefinition');

var FastUnion = function (_RefTypeDefinition) {
    _inherits(FastUnion, _RefTypeDefinition);

    function FastUnion(library, def) {
        _classCallCheck(this, FastUnion);

        return _possibleConstructorReturn(this, (FastUnion.__proto__ || Object.getPrototypeOf(FastUnion)).call(this, {
            library: library,
            FactoryType: UnionType,
            def: def,
            propertyName: 'union'
        }));
    }

    return FastUnion;
}(RefTypeDefinition);

module.exports = FastUnion;
//# sourceMappingURL=FastUnion.js.map