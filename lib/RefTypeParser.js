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
const verify = require('./verify');
const a = verify.a;
const ert = verify.ert;
const ref = require('./ref-libs/ref');
const util = require('util');
const rex = require('./rex');

class RefTypeParser {
    constructor(parser) {
        a&&ert(parser);

        this.parser = parser;
    }

    parseFields(def, keyword) {
        a&&ert(_.isString(def));

        const match = rex.matchFields(keyword, def);
        assert(match, `Invalid ${ keyword } definition format.`);
        const defBody = {};
        for (const part of match.parts) {
            const fieldDecl = part.trim();
            if (fieldDecl) {
                const decl = this.parser._parseDeclaration({
                    def: part,
                    title: 'field',
                    isInterface: false
                });
                defBody[decl.name] = decl.type;
            }
        }
        return { 
            name: match.name, 
            defBody 
        };
    }

    parseArray(def) {
        a&&ert(_.isString(def));

        const match = rex.matchArrayDeclaration(def);
        assert(match, `Invalid array definition format.`);

        return match;
    }
}

module.exports = RefTypeParser;