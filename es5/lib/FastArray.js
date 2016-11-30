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

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _ = require('lodash');
var assert = require('assert');
var RefTypeDefinition = require('./RefTypeDefinition');

var FastArray = function (_RefTypeDefinition) {
    _inherits(FastArray, _RefTypeDefinition);

    function FastArray(library, def) {
        _classCallCheck(this, FastArray);

        var _this = _possibleConstructorReturn(this, (FastArray.__proto__ || Object.getPrototypeOf(FastArray)).call(this, library, 'array', def));

        _this._type.code = 'p';
        return _this;
    }

    return FastArray;
}(RefTypeDefinition);

module.exports = FastArray;
//# sourceMappingURL=FastArray.js.map