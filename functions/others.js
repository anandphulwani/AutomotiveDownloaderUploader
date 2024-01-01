import chalk from 'chalk';

/* eslint-disable import/extensions */
import Color from '../class/Colors.js';
import {
    lgu,
    lgc,
    lgs,
    lge,
    lgh,
    lgw,
    lgi,
    lgv,
    lgb,
    lgd,
    lgt,
    lguc,
    lgcc,
    lgsc,
    lgec,
    lghc,
    lgwc,
    lgic,
    lgvc,
    lgbc,
    lgdc,
    lgtc,
} from './loggerandlocksupportive.js';
import { levelToChalkColor } from './loggerlogformats.js';
/* eslint-enable import/extensions */

/* #region Just using imports here so that it is not delete in the unused imports as, we are using it below in the eval function, inside printSectionSeperator function. */
levelToChalkColor;
lgu;
lgc;
lgs;
lge;
lgh;
lgw;
lgi;
lgv;
lgb;
lgd;
lgt;
lguc;
lgcc;
lgsc;
lgec;
lghc;
lgwc;
lgic;
lgvc;
lgbc;
lgdc;
lgtc;
/* #endregion */

function printSectionSeperator(level = 'info', isConsoleOnly = false) {
    const functionName = `lg${level[0]}${isConsoleOnly ? 'c' : ''}`;
    // eslint-disable-next-line no-eval
    if (typeof eval(functionName) === 'function') {
        // eslint-disable-next-line no-eval
        eval(`${functionName}('-'.repeat(120), levelToChalkColor[level][0])`);
    }
}

function getSumOf2DArrayColumn(arr, columnIndex) {
    let sumOfColumn = 0;
    arr.forEach((sub) => {
        sumOfColumn += sub[columnIndex];
    });
    return sumOfColumn;
}

function getIndexOfHighestIn2DArrayColumn(arr, columnIndex, debug = false) {
    let indexOfHighestNumber = null;
    let highestNumber = null;
    arr.forEach((sub, index) => {
        if (indexOfHighestNumber === null && highestNumber === null) {
            indexOfHighestNumber = index;
            highestNumber = sub[columnIndex];
            debug ? lgd(`Inside1: ${indexOfHighestNumber}:${highestNumber}`) : null;
        } else if (sub[columnIndex] > highestNumber) {
            indexOfHighestNumber = index;
            highestNumber = sub[columnIndex];
            debug ? lgd(`Inside2: ${indexOfHighestNumber}:${highestNumber}`) : null;
        }
        debug ? lgd(`Outside: ${indexOfHighestNumber}:${highestNumber}`) : null;
    });
    return indexOfHighestNumber;
}

// eslint-disable-next-line import/prefer-default-export
export { printSectionSeperator, getSumOf2DArrayColumn, getIndexOfHighestIn2DArrayColumn };
