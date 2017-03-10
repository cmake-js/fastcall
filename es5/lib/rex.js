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

var verify = require('./verify');
var a = verify.a;
var ert = verify.ert;
var _ = require('lodash');

var TYPE_AND_LEN = /^\s*([\w_][\w\d_]*)\s*(?:\[\s*(\d+)\s*\])?\s*$/;

exports.matchType = function (str) {
    a && ert(_.isString(str));

    var match = TYPE_AND_LEN.exec(str);
    if (!match) {
        return null;
    }
    return {
        name: match[1],
        length: match[2] || null
    };
};

var FUNC = /^\s*([\w_][\w\d_]*\s*\**)\s*((?:\s*\(\s*\*\s*)?([\w_][\w\d_]*)(?:\s*\)\s*)?)\s*\((.*)\)\s*$/;

exports.matchFunction = function (str) {
    a && ert(_.isString(str));

    var match = FUNC.exec(str);
    if (match && match.length === 5) {
        var resultType = match[1];
        var isCallback = match[2].indexOf('*') >= 0;
        var name = match[3].trim();
        var args = match[4].trim();
        args = args ? args.split(',') : [];
        return {
            name: name,
            isCallback: isCallback,
            args: args,
            resultType: resultType
        };
    }
    return null;
};

var BEGIN_FIELDS = '^\\s*';
var END_FIELDS = '\\s*([\\w_][\\w\\d_]*)\\s*{(.*)}\s*$';

exports.matchFields = function (keyword, str) {
    a && ert(_.isString(keyword));
    a && ert(_.isString(str));

    var regExp = new RegExp(BEGIN_FIELDS + keyword + END_FIELDS);
    var match = regExp.exec(str);
    if (match && match.length === 3) {
        var name = match[1];
        var content = match[2];
        var parts = content.split(';');
        return { name: name, parts: parts };
    }
    return null;
};

var ARRAY_DECL = /^\s*([\w_][\w\d_]*[\s\*]*)\s*\[\s*(\d*)\s*\]\s*([\w_][\w\d_]*)\s*$/;

exports.matchArrayDeclaration = function (str) {
    a && ert(_.isString(str));

    var match = ARRAY_DECL.exec(str);
    if (match && match.length === 4) {
        return {
            name: match[3],
            length: Number(match[2]),
            defBody: match[1]
        };
    }
    return null;
};

var TYPE = /(([\w_][\w\d_]*)\s*(?:\[\s*(\d+)\s*\])?)([\s\*]*)/;

exports.matchType = function (str) {
    a && ert(_.isString(str));

    var match = TYPE.exec(str);
    if (match && match.length === 5) {
        return {
            name: match[2],
            length: match[3],
            stars: match[4]
        };
    }
    return null;
};
//# sourceMappingURL=rex.js.map