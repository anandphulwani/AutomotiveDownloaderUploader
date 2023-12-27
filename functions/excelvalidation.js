import chalk from 'chalk';
/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { readDealerConfigurationExcel } from './excel.js';
import {
    allTrimStringArray,
    trimMultipleSpacesInMiddleIntoOneArray,
    trimSingleSpaceInMiddleArrayOfObjects,
    trimSingleSpaceInMiddleArray,
    removeDuplicates,
} from './stringformatting.js';
import { lgd, lge, lgw } from './loggerandlocksupportive.js';
/* eslint-enable import/extensions */

let resultStatus;
function validateDealerConfigurationExcelFile(debug = false) {
    debug ? lgd(`Validating excel file: Executing.`) : null;
    resultStatus = 'success';
    Object.keys(config.credentials).forEach((credential) => {
        const { username } = config.credentials[credential];
        const usernameTrimmed = username.includes('@') ? username.split('@')[0] : username;

        const data = readDealerConfigurationExcel(usernameTrimmed);

        debug ? lgd(`Array of values of the specified column name: ${data.map((item) => item['Dealer Number'])}`) : null;
        debug
            ? lgd(
                  `Array of objects, with row number as key, column name and column value as object: ${Object.fromEntries(
                      data.map((entry, index) => [index + 1, { 'Dealer Number': entry['Dealer Number'] }])
                  )}`
              )
            : null;
        debug
            ? lgd(
                  `Array of objects, without any key, column name and column value as object: ${data.map((o) =>
                      Object.fromEntries(['Dealer Number'].map((k) => [k, o[k]]))
                  )}`
              )
            : null;

        const dealerNumberArray = data.map((item) => item['Dealer Number']);
        validateDealerConfigurationExcelFileColumnDealerNumber(usernameTrimmed, dealerNumberArray, 'Dealer Number');

        const dealerNameArray = data.map((item) => item['Dealer Name']);
        validateDealerConfigurationExcelFileColumnDealerName(usernameTrimmed, dealerNameArray, 'Dealer Name');

        const imageNumbersToDownloadArray = data.map((item) => item['Image numbers to download']);
        validateDealerConfigurationExcelFileColumnImageNumbersToDownload(usernameTrimmed, imageNumbersToDownloadArray, 'Image numbers to download');

        const addTextToFolderNameArray = data.map((item) => item['Add text to folder name']);
        validateDealerConfigurationExcelFileColumnAddTextToFolderName(usernameTrimmed, addTextToFolderNameArray, 'Add text to folder name');

        const deleteOriginalArray = data.map((item) => item['Delete original']);
        validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, deleteOriginalArray, 'Delete original');

        const shiftOriginalArray = data.map((item) => item['Shift original 1st position to last position']);
        validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, shiftOriginalArray, 'Shift original 1st position to last position');

        const putFirstArray = data.map((item) => item['Put 1st edited images in the last position also']);
        validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, putFirstArray, 'Put 1st edited images in the last position also');

        const lockTheImageArray = data.map((item) => item['Lock the image (check mark)']);
        validateDealerConfigurationExcelFileColumnBooleanOrBlankOnly(usernameTrimmed, lockTheImageArray, 'Lock the image (check mark)');

        debug ? lgd(`resultStatus: ${resultStatus}`) : null;
    });

    debug ? lgd(`Validating excel file: Done.`) : null;
    return resultStatus;
}

function validateDealerConfigurationExcelFileColumnDealerNumber(usernameTrimmed, columnData, columnName) {
    checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName);
    checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForMultipleSpacesInMiddleInArray(usernameTrimmed, columnData, columnName);
    columnData = trimMultipleSpacesInMiddleIntoOneArray(columnData);
    checkForDuplicatesInArray(usernameTrimmed, columnData, columnName);
}

function validateDealerConfigurationExcelFileColumnDealerName(usernameTrimmed, columnData, columnName) {
    checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName);
    checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName);
    columnData = allTrimStringArray(columnData);
    // checkForMultipleSpacesInMiddleInArray(usernameTrimmed, columnData, columnName);
    // columnData = trimMultipleSpacesInMiddleIntoOneArray(columnData);
}

function validateDealerConfigurationExcelFileColumnImageNumbersToDownload(usernameTrimmed, columnData, columnName) {
    checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName);
    checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForSingleSpaceInMiddleInArray(usernameTrimmed, columnData, columnName);
    columnData = trimSingleSpaceInMiddleArray(columnData);
    checkForNumbersAndCommaOnlyInArray(usernameTrimmed, columnData, columnName);
}

function validateDealerConfigurationExcelFileColumnAddTextToFolderName(usernameTrimmed, columnData, columnName) {
    checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForMultipleSpacesInMiddleInArray(usernameTrimmed, columnData, columnName);
    // columnData = trimMultipleSpacesInMiddleIntoOneArray(columnData);
}

function validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, columnData, columnName) {
    checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName);
    checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForBooleanValueOnlyInArray(usernameTrimmed, columnData, columnName);
}

function validateDealerConfigurationExcelFileColumnBooleanOrBlankOnly(usernameTrimmed, columnData, columnName) {
    checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName);
    columnData = allTrimStringArray(columnData);
    checkForBooleanOrBlankValueOnlyInArray(usernameTrimmed, columnData, columnName);
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

function checkForDuplicatesInArray(usernameTrimmed, data, columnName) {
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
        lge(`(${usernameTrimmed}) In column '${columnName}', found '${dupElement}' at multiple row numbers at ${elementsLocations.join(', ')}.`);
    });
}

function checkForEmptyCellsInArray(usernameTrimmed, data, columnName) {
    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    let elementsLocations = elementsAllIndex(data, undefined);
    if (elementsLocations.length > 0) {
        setResultStatus('error');
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        lge(`(${usernameTrimmed}) In column '${columnName}', found empty/blank cell at row number at ${elementsLocations.join(', ')}.`);
    }
}

function checkForSpaceInBeginOrEndInArray(usernameTrimmed, data, columnName) {
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
        lgw(
            `(${usernameTrimmed}) In column '${columnName}', found space(s) in beginning and/or the end of element\n` +
                `         '${spaceElement}'    at row number ${elementsLocations.join(', ')}.`
        );
    });
}

function checkForMultipleSpacesInMiddleInArray(usernameTrimmed, data, columnName) {
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
        lgw(
            `(${usernameTrimmed}) In column '${columnName}', found multiple consecutive space in middle of the element\n` +
                `         '${spaceElement}'    at row number ${elementsLocations.join(', ')}.`
        );
    });
}

function checkForSingleSpaceInMiddleInArray(usernameTrimmed, data, columnName) {
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
        lgw(
            `(${usernameTrimmed}) In column '${columnName}', found single space in middle of the element\n` +
                `         '${spaceElement}'    at row number ${elementsLocations.join(', ')}.`
        );
    });
}

function checkForBooleanValueOnlyInArray(usernameTrimmed, data, columnName) {
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
        lge(
            `(${usernameTrimmed}) In column '${columnName}', found invalid value for boolean(yes/no), element value: \n` +
                `         '${notBooleanElement}'    at row number ${elementsLocations.join(', ')}.`
        );
    });
}

function checkForBooleanOrBlankValueOnlyInArray(usernameTrimmed, data, columnName) {
    const findElementsNotBooleanOrBlank = (arr) =>
        arr.filter((item) => item !== undefined && item.toLowerCase() !== 'yes' && item.toLowerCase() !== 'no');
    let notBooleanElements = findElementsNotBooleanOrBlank(data);
    notBooleanElements = removeDuplicates(notBooleanElements);

    if (notBooleanElements.length > 0) {
        setResultStatus('error');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    notBooleanElements.forEach((notBooleanElement) => {
        let elementsLocations = elementsAllIndex(data, notBooleanElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        lge(
            `(${usernameTrimmed}) In column '${columnName}', found invalid value for boolean(yes/no) or blank, element value: \n` +
                `         '${notBooleanElement}'    at row number ${elementsLocations.join(', ')}.`
        );
    });
}

function checkForNumbersAndCommaOnlyInArray(usernameTrimmed, data, columnName) {
    const numbersAndCommaRegexString = `^[0-9]+(,[0-9]+)*$`;
    const numbersAndCommaRegexExpression = new RegExp(numbersAndCommaRegexString);
    const findElementsNotNumbersAndComma = (arr) => arr.filter((item) => item !== undefined && !numbersAndCommaRegexExpression.test(item));
    let notNumbersAndCommaElements = findElementsNotNumbersAndComma(data);
    notNumbersAndCommaElements = removeDuplicates(notNumbersAndCommaElements);

    if (notNumbersAndCommaElements.length > 0) {
        setResultStatus('error');
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    notNumbersAndCommaElements.forEach((notNumbersAndCommaElement) => {
        let elementsLocations = elementsAllIndex(data, notNumbersAndCommaElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        lge(
            `(${usernameTrimmed}) In column '${columnName}', found invalid value for numbers separeted by comma, element value: \n` +
                `         '${notNumbersAndCommaElement}'    at row number ${elementsLocations.join(', ')}.`
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
export { validateDealerConfigurationExcelFile };
