'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var _ = require('lodash');
var assert = require('assert');
var verify = require('./verify');
var ref = require('./ref');
var util = require('util');

var IS_X64 = process.arch === 'x64';

var FunctionDefinition = function () {
    function FunctionDefinition(library, def) {
        _classCallCheck(this, FunctionDefinition);

        assert(_.isObject(library));
        this.library = library;
        if (_.isString(def)) {
            def = parseString(library, def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        } else if (_.isPlainObject(def)) {
            def = parseObject(library, def);
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        } else if (def.resultType && def.name && def.args) {
            this.resultType = def.resultType;
            this.name = def.name;
            this.args = Object.freeze(def.args);
        } else {
            throw new TypeError('Invalid function definition type.');
        }

        assert(_.isObject(this.resultType));
        assert(_.isString(this.name) && this.name.length);
        assert(_.isArray(this.args));

        this.signature = this._makeSignature();
    }

    _createClass(FunctionDefinition, [{
        key: 'toString',
        value: function toString() {
            var args = this.args.map(function (arg) {
                return util.format('%s %s', getTypeName(arg.type), arg.name);
            }).join(', ');
            return util.format('%s %s(%s)', getTypeName(this.resultType), this.name, args);

            function getTypeName(type) {
                if (type.function) {
                    return type.function.name;
                }
                if (type.callback) {
                    return type.callback.name;
                }
                return type.name;
            }
        }
    }, {
        key: 'toFastcallName',
        value: function toFastcallName(typeName) {
            return _.upperFirst(_.camelCase(typeName)).replace('Uint', 'UInt');
        }
    }, {
        key: 'findFastcallFunc',
        value: function findFastcallFunc(api, prefix, type) {
            var name = prefix + (type.indirection > 1 ? 'Pointer' : this.toFastcallName(type.name));
            var func = api[name];
            verify(_.isFunction(func));
            return { name: name, type: type, func: func };
        }
    }, {
        key: '_makeSignature',
        value: function _makeSignature() {
            var argTypes = this.args.map(function (a) {
                return a.type;
            }).map(function (t) {
                return getTypeCode(t);
            });

            return argTypes + ')' + getTypeCode(this.resultType);
        }
    }]);

    return FunctionDefinition;
}();

module.exports = FunctionDefinition;

function parseString(library, def) {
    var parts = /^\s*([\w_][\w\d_]*\s*\**)\s*([\w_][\w\d_]*)\s*\((.*)\)\s*$/.exec(def);
    assert(parts && parts.length === 4, 'Invalid function definition format.');
    var resultType = makeRef(library, parts[1]);
    var name = parts[2].trim();
    var args = parts[3].trim();
    args = args ? args.split(',') : [];
    var i = -1;
    args = args.map(function (arg) {
        i++;
        arg = arg.trim();
        assert(arg, 'Invalid argument: ' + arg);
        var pos = _.lastIndexOf(arg, ' ');
        if (pos === -1) {
            pos = _.lastIndexOf(arg, '*');
        }
        if (pos === -1) {
            pos = arg.length - 1;
        }
        var part1 = arg.substr(0, pos + 1).trim();
        var part2 = arg.substr(pos + 1).trim();
        if (!part1 && part2) {
            part1 = part2;
            part2 = null;
        }
        assert(part1, 'Invalid argument: ' + arg);
        return {
            name: part2 || 'arg' + i,
            type: makeRef(library, part1)
        };
    });
    return { resultType: resultType, name: name, args: args };
}

function parseObject(library, def) {
    // node-ffi format
    var keys = _.keys(def);
    assert(keys.length === 1, 'Object has invalid number of keys.');
    var name = keys[0];
    var arr = def[name];
    assert(_.isArray(arr), 'Function definition array expected.');
    assert(arr.length > 1, 'Function definition array is empty.');
    var resultType = makeRef(library, arr[0]);
    var args = [];
    if (_.isArray(arr[1])) {
        for (var i = 0; i < arr[1].length; i++) {
            args.push({
                name: 'arg' + i,
                type: makeRef(library, arr[1][i])
            });
        }
    }
    return { resultType: resultType, name: name, args: args };
}

function makeRef(library, value) {
    if (_.isString(value)) {
        var callbackType = makeCallbackType(library, value);
        if (callbackType) {
            return callbackType;
        }
    }
    var type = ref.coerceType(value);
    type.code = getTypeCode(type);
    return type;
}

function makeCallbackType(library, value) {
    var callback = library.callbacks[value];
    if (callback) {
        var type = ref.refType(ref.types.void);
        type.callback = callback;
        type.code = getTypeCode(type);
        return type;
    }
    return null;
}

function getTypeCode(type) {
    // ’Z’	const char* (pointing to C string) -- ?
    var indirection = _.isObject(type) ? type.indirection : 0;
    var name = _.isString(type) ? type : type.name;

    if (indirection > 1) {
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
            return getTypeCode('char');
        case 'uint8':
            return getTypeCode('uchar');
        case 'int16':
            return getTypeCode('short');
        case 'uint16':
            return getTypeCode('ushort');
        case 'int32':
            return getTypeode('int');
        case 'uint32':
            return getTypeode('uint');
        case 'int64':
            return getTypeCode('longlong');
        case 'uint64':
            return getTypeCode('ulonglong');
        case 'size_t':
            return getTypeCode('ulong');
        case 'byte':
            return getTypeCode('uint8');
        case 'void':
            return 'v';
        default:
            assert(false, 'Unknonwn type: ' + type.name);
    }
}
//# sourceMappingURL=FunctionDefinition.js.map
