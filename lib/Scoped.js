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
const scope = require('./scope');

class Scoped {
    constructor() {
        scope._add(this);
    }

    _dispose() {
        dispose(this);
    }
}

Scoped.Legacy = function () {
    scope._add(this);
}

Scoped.Legacy.prototype._dispose = function () {
    dispose(this);
}

function dispose(obj) {
    if (_.isFunction(obj.free)) {
        return obj.free();
    }
    if (_.isFunction(obj.release)) {
        return obj.release();
    }
    if (_.isFunction(obj.close)) {
        return obj.close();
    }
    if (_.isFunction(obj.dispose)) {
        return obj.dispose();
    }
}

module.exports = scope.Scoped = Scoped;
