'use strict';
const _ = require('lodash');
const scope = require('./scope');

class Scoped {
    constructor() {
        scope._add(this);
    }

    _dispose() {
        if (_.isFunction(this.dispose)) {
            this.dispose();
        }
        if (_.isFunction(this.close)) {
            this.close();
        }
    }
}

module.exports = scope.Scoped = Scoped;
