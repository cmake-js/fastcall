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

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var verify = require('./verify');
var a = verify.a;
var ert = verify.ert;

var NameFactory = function () {
    function NameFactory() {
        _classCallCheck(this, NameFactory);

        this._store = {};
    }

    _createClass(NameFactory, [{
        key: 'makeName',
        value: function makeName(prefix) {
            a && ert(_.isString(prefix));
            var i = this._store[prefix] === undefined ? -1 : this._store[prefix];
            this._store[prefix] = ++i;
            return prefix + String(i);
        }
    }]);

    return NameFactory;
}();

module.exports = NameFactory;
//# sourceMappingURL=NameFactory.js.map