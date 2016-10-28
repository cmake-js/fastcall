'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var scope = require('./scope');

var Scoped = function () {
    function Scoped() {
        _classCallCheck(this, Scoped);

        scope._add(this);
    }

    _createClass(Scoped, [{
        key: '_dispose',
        value: function _dispose() {
            if (_.isFunction(this.dispose)) {
                this.dispose();
            }
            if (_.isFunction(this.close)) {
                this.close();
            }
        }
    }]);

    return Scoped;
}();

module.exports = scope.Scoped = Scoped;
//# sourceMappingURL=Scoped.js.map
