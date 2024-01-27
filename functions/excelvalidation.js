/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { readDealerConfigurationExcel } from './excel.js';
import { allTrimStringArray, trimMultipleSpacesInMiddleIntoOneArray, trimSingleSpaceInMiddleArray, removeDuplicates } from './stringformatting.js';
import { lgd, lge, lgw } from './loggerandlocksupportive.js';
import { getUsernameTrimmed } from './excelsupportive.js';
import ValidationResult from '../class/ValidationResult.js';
/* eslint-enable import/extensions */

function validateDealerConfigurationExcelFile(debug = false) {
    debug ? lgd(`Validating excel file: Executing.`) : null;
    let resultStatus = ValidationResult.SUCCESS;
    Object.keys(config.credentials).forEach((credential) => {
        const { username } = config.credentials[credential];
        const usernameTrimmed = getUsernameTrimmed(username);

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
        resultStatus = Math.max(
            resultStatus,
            validateDealerConfigurationExcelFileColumnDealerNumber(usernameTrimmed, dealerNumberArray, 'Dealer Number')
        );

        const dealerNameArray = data.map((item) => item['Dealer Name']);
        resultStatus = Math.max(resultStatus, validateDealerConfigurationExcelFileColumnDealerName(usernameTrimmed, dealerNameArray, 'Dealer Name'));

        const imageNumbersToDownloadArray = data.map((item) => item['Image numbers to download']);
        resultStatus = Math.max(
            resultStatus,
            validateDealerConfigurationExcelFileColumnImageNumbersToDownload(
                usernameTrimmed,
                imageNumbersToDownloadArray,
                'Image numbers to download'
            )
        );

        const addTextToFolderNameArray = data.map((item) => item['Add text to folder name']);
        resultStatus = Math.max(
            resultStatus,
            validateDealerConfigurationExcelFileColumnAddTextToFolderName(usernameTrimmed, addTextToFolderNameArray, 'Add text to folder name')
        );

        const deleteOriginalArray = data.map((item) => item['Delete original']);
        resultStatus = Math.max(
            resultStatus,
            validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, deleteOriginalArray, 'Delete original')
        );

        const shiftOriginalArray = data.map((item) => item['Shift original 1st position to last position']);
        resultStatus = Math.max(
            resultStatus,
            validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, shiftOriginalArray, 'Shift original 1st position to last position')
        );

        const putFirstArray = data.map((item) => item['Put 1st edited images in the last position also']);
        resultStatus = Math.max(
            resultStatus,
            validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, putFirstArray, 'Put 1st edited images in the last position also')
        );

        const lockTheImageArray = data.map((item) => item['Lock the image (check mark)']);
        resultStatus = Math.max(
            resultStatus,
            validateDealerConfigurationExcelFileColumnBooleanOrBlankOnly(usernameTrimmed, lockTheImageArray, 'Lock the image (check mark)')
        );

        debug ? lgd(`resultStatus: ${resultStatus}`) : null;
    });

    debug ? lgd(`Validating excel file: Done.`) : null;
    return resultStatus;
}

function validateDealerConfigurationExcelFileColumnDealerNumber(usernameTrimmed, columnData, columnName) {
    let resultStatus = ValidationResult.SUCCESS;
    resultStatus = Math.max(resultStatus, checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName));
    resultStatus = Math.max(resultStatus, checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName));
    columnData = allTrimStringArray(columnData);
    resultStatus = Math.max(resultStatus, checkForMultipleSpacesInMiddleInArray(usernameTrimmed, columnData, columnName));
    columnData = trimMultipleSpacesInMiddleIntoOneArray(columnData);
    resultStatus = Math.max(resultStatus, checkForDuplicatesInArray(usernameTrimmed, columnData, columnName));
    return resultStatus;
}

function validateDealerConfigurationExcelFileColumnDealerName(usernameTrimmed, columnData, columnName) {
    let resultStatus = ValidationResult.SUCCESS;
    resultStatus = Math.max(resultStatus, checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName));
    resultStatus = Math.max(resultStatus, checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName));
    columnData = allTrimStringArray(columnData);
    return resultStatus;
}

function validateDealerConfigurationExcelFileColumnImageNumbersToDownload(usernameTrimmed, columnData, columnName) {
    let resultStatus = ValidationResult.SUCCESS;
    resultStatus = Math.max(resultStatus, checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName));
    resultStatus = Math.max(resultStatus, checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName));
    columnData = allTrimStringArray(columnData);
    resultStatus = Math.max(resultStatus, checkForSingleSpaceInMiddleInArray(usernameTrimmed, columnData, columnName));
    columnData = trimSingleSpaceInMiddleArray(columnData);
    resultStatus = Math.max(resultStatus, checkForNumbersAndCommaOnlyInArray(usernameTrimmed, columnData, columnName));
    return resultStatus;
}

function validateDealerConfigurationExcelFileColumnAddTextToFolderName(usernameTrimmed, columnData, columnName) {
    let resultStatus = ValidationResult.SUCCESS;
    resultStatus = Math.max(resultStatus, checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName));
    columnData = allTrimStringArray(columnData);
    resultStatus = Math.max(resultStatus, checkForMultipleSpacesInMiddleInArray(usernameTrimmed, columnData, columnName));
    return resultStatus;
}

function validateDealerConfigurationExcelFileColumnBooleanOnly(usernameTrimmed, columnData, columnName) {
    let resultStatus = ValidationResult.SUCCESS;
    resultStatus = Math.max(resultStatus, checkForEmptyCellsInArray(usernameTrimmed, columnData, columnName));
    resultStatus = Math.max(resultStatus, checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName));
    columnData = allTrimStringArray(columnData);
    resultStatus = Math.max(resultStatus, checkForBooleanValueOnlyInArray(usernameTrimmed, columnData, columnName));
    return resultStatus;
}

function validateDealerConfigurationExcelFileColumnBooleanOrBlankOnly(usernameTrimmed, columnData, columnName) {
    let resultStatus = ValidationResult.SUCCESS;
    resultStatus = Math.max(resultStatus, checkForSpaceInBeginOrEndInArray(usernameTrimmed, columnData, columnName));
    columnData = allTrimStringArray(columnData);
    resultStatus = Math.max(resultStatus, checkForBooleanOrBlankValueOnlyInArray(usernameTrimmed, columnData, columnName));
    return resultStatus;
}

/**
 *
 *
 *
 * Supporting functions
 *
 *
 *
 */

function checkForDuplicatesInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const findDuplicates = (arr) => arr.filter((item, index) => item !== undefined && arr.indexOf(item) !== index);
    let dupElements = findDuplicates(data); // All duplicates
    dupElements = removeDuplicates(dupElements);

    if (dupElements.length > 0) {
        returnVal = ValidationResult.ERROR;
    }

    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    dupElements.forEach((dupElement) => {
        let elementsLocations = elementsAllIndex(data, dupElement);
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        lge(`(${usernameTrimmed}) In column '${columnName}', found '${dupElement}' at multiple row numbers at ${elementsLocations.join(', ')}.`);
    });
    return returnVal;
}

function checkForEmptyCellsInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const elementsAllIndex = (arr, val) => arr.reduce((acc, el, i) => (el === val ? [...acc, i] : acc), []);
    let elementsLocations = elementsAllIndex(data, undefined);
    if (elementsLocations.length > 0) {
        returnVal = ValidationResult.ERROR;
        elementsLocations = elementsLocations.map((entry) => entry + 2);
        lge(`(${usernameTrimmed}) In column '${columnName}', found empty/blank cell at row number at ${elementsLocations.join(', ')}.`);
    }
    return returnVal;
}

function checkForSpaceInBeginOrEndInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const findElementsContainsSpacesInBeginOrEnd = (arr) => arr.filter((item) => item !== undefined && (item.startsWith(' ') || item.endsWith(' ')));
    let spaceElements = findElementsContainsSpacesInBeginOrEnd(data);
    spaceElements = removeDuplicates(spaceElements);

    if (spaceElements.length > 0) {
        returnVal = ValidationResult.WARN;
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
    return returnVal;
}

function checkForMultipleSpacesInMiddleInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const findElementsContainsMultipleSpacesInMiddle = (arr) => arr.filter((item) => item !== undefined && item.includes('  '));
    let spaceElements = findElementsContainsMultipleSpacesInMiddle(data);
    spaceElements = removeDuplicates(spaceElements);

    if (spaceElements.length > 0) {
        returnVal = ValidationResult.WARN;
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
    return returnVal;
}

function checkForSingleSpaceInMiddleInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const findElementsContainsSingleSpacesInMiddle = (arr) => arr.filter((item) => item !== undefined && item.includes(' '));
    let spaceElements = findElementsContainsSingleSpacesInMiddle(data);
    spaceElements = removeDuplicates(spaceElements);

    if (spaceElements.length > 0) {
        returnVal = ValidationResult.WARN;
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
    return returnVal;
}

function checkForBooleanValueOnlyInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const findElementsNotBoolean = (arr) => arr.filter((item) => item !== undefined && item.toLowerCase() !== 'yes' && item.toLowerCase() !== 'no');
    let notBooleanElements = findElementsNotBoolean(data);
    notBooleanElements = removeDuplicates(notBooleanElements);

    if (notBooleanElements.length > 0) {
        returnVal = ValidationResult.ERROR;
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
    return returnVal;
}

function checkForBooleanOrBlankValueOnlyInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const findElementsNotBooleanOrBlank = (arr) =>
        arr.filter((item) => item !== undefined && item.toLowerCase() !== 'yes' && item.toLowerCase() !== 'no');
    let notBooleanElements = findElementsNotBooleanOrBlank(data);
    notBooleanElements = removeDuplicates(notBooleanElements);

    if (notBooleanElements.length > 0) {
        returnVal = ValidationResult.ERROR;
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
    return returnVal;
}

function checkForNumbersAndCommaOnlyInArray(usernameTrimmed, data, columnName) {
    let returnVal = ValidationResult.SUCCESS;
    const numbersAndCommaRegexString = `^[0-9]+(,[0-9]+)*$`;
    const numbersAndCommaRegexExpression = new RegExp(numbersAndCommaRegexString);
    const findElementsNotNumbersAndComma = (arr) => arr.filter((item) => item !== undefined && !numbersAndCommaRegexExpression.test(item));
    let notNumbersAndCommaElements = findElementsNotNumbersAndComma(data);
    notNumbersAndCommaElements = removeDuplicates(notNumbersAndCommaElements);

    if (notNumbersAndCommaElements.length > 0) {
        returnVal = ValidationResult.ERROR;
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
    return returnVal;
}
/**
 *
 * Status can be set to success, warn, error
 * Default status is success,
 * Once set to warn, it cannot be set back to success
 * Once set to error, it cannot be set back to warn or success
 *
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
export { validateDealerConfigurationExcelFileColumnDealerNumber, validateDealerConfigurationExcelFile };
