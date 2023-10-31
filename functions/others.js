import chalk from 'chalk';

/* eslint-disable import/extensions */
import { lgi } from './loggersupportive.js';
/* eslint-enable import/extensions */

// TODO: Add functionality that if we want to send parameter that whether its info or error or warn
function printSectionSeperator() {
    lgi(chalk.black.bgWhiteBright('-'.repeat(80)));
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

function getIndexOfHighestIn2DArrayColumn(arr, columnIndex) {
    let indexOfHighestNumber = null;
    let highestNumber = null;
    arr.forEach((sub, index) => {
        if (indexOfHighestNumber === null && highestNumber === null) {
            indexOfHighestNumber = index;
            highestNumber = sub[columnIndex];
            // console.log(`Inside1: ${indexOfHighestNumber}:${highestNumber}`);
        } else if (sub[columnIndex] > highestNumber) {
            indexOfHighestNumber = index;
            highestNumber = sub[columnIndex];
            // console.log(`Inside2: ${indexOfHighestNumber}:${highestNumber}`);
        }
        // console.log(`Outside: ${indexOfHighestNumber}:${highestNumber}`);
    });
    return indexOfHighestNumber;
}

// eslint-disable-next-line import/prefer-default-export
export { printSectionSeperator, getSumOf2DArrayColumn, getIndexOfHighestIn2DArrayColumn, incRetryCount, getRetryCount };
