import chalk from 'chalk';

/* eslint-disable import/extensions */
import Color from '../class/Colors.js';
import { lgd, lgi } from './loggerandlocksupportive.js';
/* eslint-enable import/extensions */

// TODO: Add functionality that if we want to send parameter that whether its info or error or warn
function printSectionSeperator() {
    lgi('-'.repeat(120), Color.bgWhite);
}

// ONPROJECTFINISH: Remove retryCount variable and relative functions, when debugging is complete
let retryCount = 0;
function incRetryCount() {
    retryCount++;
}

function getRetryCount() {
    return retryCount;
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
export { printSectionSeperator, getSumOf2DArrayColumn, getIndexOfHighestIn2DArrayColumn, incRetryCount, getRetryCount };
