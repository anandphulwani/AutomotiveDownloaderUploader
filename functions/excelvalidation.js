import chalk from 'chalk';
/* eslint-disable import/extensions */
import { readDealerConfigurationExcel } from './excel.js';
import {
    allTrimStringArray,
    trimMultipleSpacesInMiddleIntoOneArray,
    trimSingleSpaceInMiddleArrayOfObjects,
    trimSingleSpaceInMiddleArray,
    removeDuplicates,
} from './stringformatting.js';
/* eslint-enable import/extensions */

let resultStatus;
function validateExcelFile(seconds, debug = false) {
    debug ? console.log(`Validating excel file: Executing.`) : '';
    const data = readDealerConfigurationExcel();

    // Array of values of the specified column name
    // console.log(data.map((item) => item['Dealer Number']));

    // Array of objects, with row number as key, column name and column value as object
    // const test = Object.fromEntries(data.map((entry, index) => [index + 1, { 'Dealer Number': entry['Dealer Number'] }]));
    // console.log(test);

    // Array of bjects, without any key, column name and column value as object
    // const redux1 = (list) => list.map((o) => Object.fromEntries(['Dealer Number'].map((k) => [k, o[k]])));
    // console.log(redux1(data));

    resultStatus = 'success';

    const dealerNumberArray = data.map((item) => item['Dealer Number']);
    validateExcelFileColumnDealerNumber(dealerNumberArray, 'Dealer Number');
    const dealerNameArray = data.map((item) => item['Dealer Name']);
    validateExcelFileColumnDealerName(dealerNameArray, 'Dealer Name');
    const imageNumbersToDownloadArray = data.map((item) => item['Image numbers to download']);
    validateExcelFileColumnImageNumbersToDownload(imageNumbersToDownloadArray, 'Image numbers to download');
    const addTextToFolderNameArray = data.map((item) => item['Add text to folder name']);
    validateExcelFileColumnAddTextToFolderName(addTextToFolderNameArray, 'Add text to folder name');
    const deleteOriginalArray = data.map((item) => item['Delete original']);
    validateExcelFileColumnBooleanOnly(deleteOriginalArray, 'Delete original');
    const shiftOriginalArray = data.map((item) => item['Shift original 1st position to last position']);
    validateExcelFileColumnBooleanOnly(shiftOriginalArray, 'Shift original 1st position to last position');
    const putFirstArray = data.map((item) => item['Put 1st edited images in the last position also']);
    validateExcelFileColumnBooleanOnly(putFirstArray, 'Put 1st edited images in the last position also');
    const lockTheImageArray = data.map((item) => item['Lock the image (check mark)']);
    validateExcelFileColumnBooleanOnly(lockTheImageArray, 'Lock the image (check mark)');
    console.log(`resultStatus: ${resultStatus}`);

    debug ? console.log(`Validating excel file: Done.`) : '';
}

function validateExcelFileColumnDealerNumber(columnData, columnName) {
    checkForEmptyCells(columnData, columnName);
    checkForSpaceInBeginOrEnd(columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForMultipleSpacesInMiddle(columnData, columnName);
    columnData = trimMultipleSpacesInMiddleIntoOneArray(columnData);
    checkForDuplicates(columnData, columnName);
}

function validateExcelFileColumnDealerName(columnData, columnName) {
    checkForEmptyCells(columnData, columnName);
    checkForSpaceInBeginOrEnd(columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForMultipleSpacesInMiddle(columnData, columnName);
    // columnData = trimMultipleSpacesInMiddleIntoOneArray(columnData);
}

function validateExcelFileColumnImageNumbersToDownload(columnData, columnName) {
    checkForEmptyCells(columnData, columnName);
    checkForSpaceInBeginOrEnd(columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForSingleSpaceInMiddle(columnData, columnName);
    columnData = trimSingleSpaceInMiddleArray(columnData);
    checkForNumbersAndCommaOnly(columnData, columnName);
    // TODO: Check whether it contains numbers and only comma
}

function validateExcelFileColumnAddTextToFolderName(columnData, columnName) {
    checkForSpaceInBeginOrEnd(columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForMultipleSpacesInMiddle(columnData, columnName);
    // columnData = trimMultipleSpacesInMiddleIntoOneArray(columnData);
}

function validateExcelFileColumnBooleanOnly(columnData, columnName) {
    checkForEmptyCells(columnData, columnName);
    checkForSpaceInBeginOrEnd(columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForBooleanValueOnly(columnData, columnName);
}

/**
 *
 * Supporting functions
 *
 *
 *
 *
 *
 */

function checkForDuplicates(data, columnName) {
    const findDuplicates = (arr) => arr.filter((item, index) => item !== undefined && arr.indexOf(item) !== index);
    let dupElements = findDuplicates(data); // All duplicates
    dupElements = removeDuplicates(dupElements);

    if (dupElements.length > 0) {
        setResultStatus('error');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    dupElements.forEach((dupElement) => {
        let elementsLocations = elementsAllIndex(data, dupElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: In column '${columnName}', found '${dupElement}' at multiple row numbers at ${elementsLocations.join(', ')}.`
            )
        );
    });
}

function checkForEmptyCells(data, columnName) {
    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    let elementsLocations = elementsAllIndex(data, undefined);
    if (elementsLocations.length > 0) {
        setResultStatus('error');
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        console.log(
            chalk.white.bgRed.bold(`ERROR: In column '${columnName}', found empty/blank cell at row number at ${elementsLocations.join(', ')}.`)
        );
    }
}

function checkForSpaceInBeginOrEnd(data, columnName) {
    const findElementsContainsSpacesInBeginOrEnd = (arr) => arr.filter((item) => item !== undefined && (item.startsWith(' ') || item.endsWith(' ')));
    let spaceElements = findElementsContainsSpacesInBeginOrEnd(data);
    spaceElements = removeDuplicates(spaceElements);

    if (spaceElements.length > 0) {
        setResultStatus('warn');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    spaceElements.forEach((spaceElement) => {
        let elementsLocations = elementsAllIndex(data, spaceElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        console.log(
            chalk.white.bgYellow.bold(
                `WARNING: In column '${columnName}', found space(s) in beginning and/or the end of element\n` +
                    `         '${spaceElement}'    at row number ${elementsLocations.join(', ')}.`
            )
        );
    });
}

function checkForMultipleSpacesInMiddle(data, columnName) {
    const findElementsContainsMultipleSpacesInMiddle = (arr) => arr.filter((item) => item !== undefined && item.includes('  '));
    let spaceElements = findElementsContainsMultipleSpacesInMiddle(data);
    spaceElements = removeDuplicates(spaceElements);

    if (spaceElements.length > 0) {
        setResultStatus('warn');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    spaceElements.forEach((spaceElement) => {
        let elementsLocations = elementsAllIndex(data, spaceElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        console.log(
            chalk.white.bgYellow.bold(
                `WARNING: In column '${columnName}', found multiple consecutive space in middle of the element\n` +
                    `         '${spaceElement}'    at row number ${elementsLocations.join(', ')}.`
            )
        );
    });
}

function checkForSingleSpaceInMiddle(data, columnName) {
    const findElementsContainsSingleSpacesInMiddle = (arr) => arr.filter((item) => item !== undefined && item.includes(' '));
    let spaceElements = findElementsContainsSingleSpacesInMiddle(data);
    spaceElements = removeDuplicates(spaceElements);

    if (spaceElements.length > 0) {
        setResultStatus('warn');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    spaceElements.forEach((spaceElement) => {
        let elementsLocations = elementsAllIndex(data, spaceElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        console.log(
            chalk.white.bgYellow.bold(
                `WARNING: In column '${columnName}', found single space in middle of the element\n` +
                    `         '${spaceElement}'    at row number ${elementsLocations.join(', ')}.`
            )
        );
    });
}

function checkForBooleanValueOnly(data, columnName) {
    const findElementsNotBoolean = (arr) => arr.filter((item) => item !== undefined && item.toLowerCase() !== 'yes' && item.toLowerCase() !== 'no');
    let notBooleanElements = findElementsNotBoolean(data);
    notBooleanElements = removeDuplicates(notBooleanElements);

    if (notBooleanElements.length > 0) {
        setResultStatus('error');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    notBooleanElements.forEach((notBooleanElement) => {
        let elementsLocations = elementsAllIndex(data, notBooleanElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: In column '${columnName}', found invalid value for boolean(yes/no), element value: \n` +
                    `         '${notBooleanElement}'    at row number ${elementsLocations.join(', ')}.`
            )
        );
    });
}

function checkForNumbersAndCommaOnly(data, columnName) {
    const findElementsNotNumbersAndComma = (arr) => arr.filter((item) => item !== undefined && !/^[0-9]+(,[0-9]+)*$/.test(item));
    let notNumbersAndCommaElements = findElementsNotNumbersAndComma(data);
    notNumbersAndCommaElements = removeDuplicates(notNumbersAndCommaElements);

    if (notNumbersAndCommaElements.length > 0) {
        setResultStatus('error');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    notNumbersAndCommaElements.forEach((notNumbersAndCommaElement) => {
        let elementsLocations = elementsAllIndex(data, notNumbersAndCommaElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: In column '${columnName}', found invalid value for numbers separeted by comma, element value: \n` +
                    `         '${notNumbersAndCommaElement}'    at row number ${elementsLocations.join(', ')}.`
            )
        );
    });
}
/**
 *
 * Status can be set to success, warn, error
 * Default status is success,
 * Once set to warn, it cannot be set back to success
 * Once set to error, it cannot be set back to warn or success
 */
function setResultStatus(statusToSet) {
    if (statusToSet === 'success') {
        // No point in setting status to success, since it is default value,
        // and once the value is change to warn or error, there is no reverting back
        return;
    }
    if (statusToSet === 'warn' && resultStatus === 'error') {
        // If statusToSet is being set to warn, but resultStatus is already error
        // then no reverting back to warn.
        return;
    }
    resultStatus = statusToSet;
}

// eslint-disable-next-line import/prefer-default-export
export { validateExcelFile };
