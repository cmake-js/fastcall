'use strict';
const path = require('path');
const fs = require('fs');

let testlib = null;

exports.findTestlib = function () {
    if (testlib) {
        return testlib;
    }

    const rootDir = path.join(__dirname, '../build');
    testlib = findIn('Debug') || findIn('Release');
    if (!testlib) {
        throw new Error('testlib library is not found.');
    }
    return testlib;

    function findIn(name) {
        const dir = path.join(rootDir, name);
        const files = fs.readdirSync(dir);
        for (const file of files) {
            if (/testlib/.test(file)) {
                return path.join(dir, file);
            }
        }
        return null;
    }
}