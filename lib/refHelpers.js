'use strict';
const ref = require('./ref-libs/ref');

exports.isPointerType = isPointerType;
exports.isArrayType = isArrayType;
exports.isUnionType = isUnionType;
exports.isStructType = isStructType;
exports.isFunctionType = isFunctionType;
exports.isStringType = isStringType;

function isPointerType(type) {
    const _type = ref.coerceType(type);
    return _type.indirection > 1 || 
        _type.name === 'ArrayType' ||
        _type.name === 'Function' ||
        _type === ref.types.CString;
}

function isArrayType(type) {
    const _type = ref.coerceType(type);
    return _type.name === 'ArrayType' && _type.indirection === 1;
}

function isUnionType(type) {
    const _type = ref.coerceType(type);
    return _type.name === 'UnionType' && _type.indirection === 1;
}

function isStructType(type) {
    const _type = ref.coerceType(type);
    return _type.name === 'StructType' && _type.indirection === 1;
}

function isFunctionType(type) {
    const _type = ref.coerceType(type);
    return _type.name === 'Function' && _type.indirection === 1;
}

function isStringType(type) {
    const _type = ref.coerceType(type);
    return _type === ref.types.CString;
}