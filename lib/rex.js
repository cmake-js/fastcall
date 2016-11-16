'use strict';
const verify = require('./verify');
const _ = require('lodash');

const TYPE_AND_LEN = /^\s*([\w_][\w\d_]*)\s*(?:\[\s*(\d+)\s*\])?\s*$/;

exports.matchType = function (str) {
    verify(_.isString(str));

    const match = TYPE_AND_LEN.exec(str);
    if (!match) {
        return null;
    }
    return {
        name: match[1],
        length: match[2] || null
    };
}

const FUNC = /^\s*([\w_][\w\d_]*\s*\**)\s*([\w_][\w\d_]*)\s*\((.*)\)\s*$/;

exports.matchFunction = function (str) {
    verify(_.isString(str));

    const match = FUNC.exec(str);
    if (match && match.length === 4) {
        const resultType = match[1];
        const name = match[2].trim();
        let args = match[3].trim();
        args = args ? args.split(',') : [];
        return {
            name,
            args,
            resultType
        };
    }
    return null;    
}

const BEGIN_FIELDS = '^\\s*';
const END_FIELDS = '\\s*([\\w_][\\w\\d_]*)\\s*{(.*)}\s*$';

exports.matchFields = function (keyword, str) {
    verify(_.isString(keyword));
    verify(_.isString(str));

    const regExp = new RegExp(BEGIN_FIELDS + keyword + END_FIELDS);
    const match = regExp.exec(str);
    if (match && match.length === 3) {
        const name = match[1];
        const content = match[2];
        const parts = content.split(';');
        return { name, parts };
    }
    return null;
}

const ARRAY_DECL = /^\s*([\w_][\w\d_]*)\s*\[\s*\]\s*([\w_][\w\d_]*)\s*$/;

exports.matchArrayDeclaration = function (str) {
    verify(_.isString(str));

    const match = ARRAY_DECL.exec(str);
    if (match && match.length === 3) {
        return { 
            name: match[2], 
            defBody: match[1] 
        };
    }
    return null;
}

const TYPE = /(([\w_][\w\d_]*)\s*(?:\[\s*(\d+)\s*\])?)([\s\*]*)/;

exports.matchType = function (str) {
    verify(_.isString(str));

    const match = TYPE.exec(str);
    if (match && match.length === 5) {
        return {
            name: match[2],
            length: match[3],
            stars: match[4]
        };
    }
    return null;
}