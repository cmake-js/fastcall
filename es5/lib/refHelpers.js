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

var ref = require('./ref-libs/ref');

exports.isPointerType = isPointerType;
exports.isArrayType = isArrayType;
exports.isUnionType = isUnionType;
exports.isStructType = isStructType;
exports.isFunctionType = isFunctionType;
exports.isStringType = isStringType;

function isPointerType(type) {
    var _type = ref.coerceType(type);
    return _type.indirection > 1 || _type.name === 'ArrayType' || _type.name === 'Function' || _type === ref.types.CString;
}

function isArrayType(type) {
    var _type = ref.coerceType(type);
    return _type.name === 'ArrayType' && _type.indirection === 1;
}

function isUnionType(type) {
    var _type = ref.coerceType(type);
    return _type.name === 'UnionType' && _type.indirection === 1;
}

function isStructType(type) {
    var _type = ref.coerceType(type);
    return _type.name === 'StructType' && _type.indirection === 1;
}

function isFunctionType(type) {
    var _type = ref.coerceType(type);
    return _type.name === 'Function' && _type.indirection === 1;
}

function isStringType(type) {
    var _type = ref.coerceType(type);
    return _type === ref.types.CString;
}
//# sourceMappingURL=refHelpers.js.map