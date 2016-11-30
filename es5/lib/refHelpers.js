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