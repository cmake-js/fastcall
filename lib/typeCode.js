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
const ref = require('./ref-libs/ref');
const refHelpers = require('./refHelpers');

exports.getForType = getForType;

function getForType(type) {
    type = ref.coerceType(type);

    const indirection = type.indirection;
    const name = type.name;

    if (refHelpers.isPointerType(type)) {
        return 'p';
    }
    switch (name) {
        case 'bool':
            return 'B';
        case 'char':
            return 'c';
        case 'uchar':
            return 'C';
        case 'short':
            return 's';
        case 'ushort':
            return 'S';
        case 'int':
            return 'i';
        case 'uint':
            return 'I';
        case 'long':
            return 'j';
        case 'ulong':
            return 'J';
        case 'longlong':
            return 'l';
        case 'ulonglong':
            return 'L';
        case 'float':
            return 'f';
        case 'double':
            return 'd';
        case 'int8':
            return getForType('char');
        case 'uint8':
            return getForType('uchar');
        case 'int16':
            return getForType('short');
        case 'uint16':
            return getForType('ushort');
        case 'int32':
            return getForType('int');
        case 'uint32':
            return getForType('uint');
        case 'int64':
            return getForType('longlong');
        case 'uint64':
            return getForType('ulonglong');
        case 'size_t':
            return getForType('ulong');
        case 'byte':
            return getForType('uint8');
        case 'void':
            return 'v';
        default:
            assert(false, 'Unknonwn type: ' + type.name);
    }
}