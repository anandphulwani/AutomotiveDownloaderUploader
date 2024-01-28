/* eslint-disable import/extensions */
import { checkForSpaceInBeginOrEnd, checkForMultipleSpacesInMiddle, allTrimString, trimMultipleSpacesInMiddleIntoOne } from './stringformatting.js';
import { lgw } from './loggerandlocksupportive.js';
import ValidationResult from '../class/ValidationResult.js';
/* eslint-enable import/extensions */

function validateBookmarkNameText(dealerLevelBookmarkName, username, isPrintErrorOrWarn) {
    let validationStatus = ValidationResult.SUCCESS;
    dealerLevelBookmarkName = dealerLevelBookmarkName.includes(' |#| ') ? dealerLevelBookmarkName.split(' |#| ')[0] : dealerLevelBookmarkName;
    validationStatus = Math.max(validationStatus, checkForSpaceInBeginOrEndOfBookmarkName(dealerLevelBookmarkName, username, isPrintErrorOrWarn));
    dealerLevelBookmarkName = allTrimString(dealerLevelBookmarkName);
    validationStatus = Math.max(
        validationStatus,
        checkForMultipleSpacesInMiddleOfBookmarkName(dealerLevelBookmarkName, username, isPrintErrorOrWarn)
    );
    dealerLevelBookmarkName = trimMultipleSpacesInMiddleIntoOne(dealerLevelBookmarkName);
    return [validationStatus, dealerLevelBookmarkName];
}

function checkForSpaceInBeginOrEndOfBookmarkName(dealerLevelBookmarkName, username, isPrintErrorOrWarn) {
    let validationStatus = ValidationResult.SUCCESS;
    if (checkForSpaceInBeginOrEnd(dealerLevelBookmarkName)) {
        if (isPrintErrorOrWarn) {
            lgw(
                `Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found space(s) in beginning and/or the end of bookmark name.`
            );
        }
        validationStatus = ValidationResult.WARN;
    }
    return validationStatus;
}

function checkForMultipleSpacesInMiddleOfBookmarkName(dealerLevelBookmarkName, username, isPrintErrorOrWarn) {
    let validationStatus = ValidationResult.SUCCESS;
    if (checkForMultipleSpacesInMiddle(dealerLevelBookmarkName)) {
        if (isPrintErrorOrWarn) {
            lgw(
                `Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found multiple consecutive space in middle of bookmark name.`
            );
        }
        validationStatus = ValidationResult.WARN;
    }
    return validationStatus;
}

// eslint-disable-next-line import/prefer-default-export
export { validateBookmarkNameText };
