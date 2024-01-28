/* eslint-disable import/extensions */
import { getAllUsernamesBookmarks } from './bookmarksupportive.js';
import { setCurrentDealerConfiguration, getAllDealerNumbers } from './excelsupportive.js';
import { checkForSpaceInBeginOrEnd, checkForMultipleSpacesInMiddle, allTrimString, trimMultipleSpacesInMiddleIntoOne } from './stringformatting.js';
import { lgd, lge, lgw } from './loggerandlocksupportive.js';
import ValidationResult from '../class/ValidationResult.js';
/* eslint-enable import/extensions */

function validateBookmarksAndCheckCredentialsPresent(isPrintErrorOrWarn, debug = false) {
    let validationStatus = ValidationResult.SUCCESS;
    debug ? lgd(`Validating bookmarks and checking if credentials are present: Executing.`) : null;
    const allUsernamesBookmarks = getAllUsernamesBookmarks();

    /* #region Filter non duplicate username level bookmarks. */
    const uniqueUsernamesBookmarks = [];
    const usernameBookmarkToRemove = [];
    let usernameBookmarkIndex = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        const uniqueUsernamesArr = uniqueUsernamesBookmarks.map((uniqueUsernameBookmark) => uniqueUsernameBookmark.name);
        if (uniqueUsernamesArr.includes(usernameBookmark.name)) {
            validationStatus = ValidationResult.ERROR;
            isPrintErrorOrWarn ? lge(`Duplicate Username level bookmark name found, a folder '${usernameBookmark.name}' is already present.`) : null;
            usernameBookmarkToRemove.push(usernameBookmarkIndex);
        } else {
            uniqueUsernamesBookmarks.push(usernameBookmark);
        }
        usernameBookmarkIndex++;
    }
    // Remove elements in reverse order to avoid index shifting
    for (let i = usernameBookmarkToRemove.length - 1; i >= 0; i--) {
        allUsernamesBookmarks.splice(usernameBookmarkToRemove[i], 1);
    }
    /* #endregion */

    /* #region Filter non duplicate dealerLevel bookmarks */
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        setCurrentDealerConfiguration(usernameBookmark.name);
        const allDealerNumbers = getAllDealerNumbers();

        const dealerLevelBookmarks = usernameBookmark.children;
        const dealerLevelBookmarkNames = [];

        const dealerLevelBookmarkToRemove = [];
        let dealerLevelBookmarkIndex = 0;
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of dealerLevelBookmarks) {
            const validateBookmarkNameTextResult = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name, isPrintErrorOrWarn);
            validationStatus = Math.max(validationStatus, validateBookmarkNameTextResult[0]);
            const dealerLevelBookmarkName = validateBookmarkNameTextResult[1];
            if (!allDealerNumbers.includes(dealerLevelBookmarkName)) {
                validationStatus = ValidationResult.ERROR;
                isPrintErrorOrWarn
                    ? lge(
                          `Unable to find dealer folder: '${dealerLevelBookmarkName}' for the Username: '${usernameBookmark.name}', it is not present in the excel.`
                      )
                    : null;
                dealerLevelBookmarkToRemove.push(dealerLevelBookmarkIndex);
            }
            if (dealerLevelBookmarkNames.includes(dealerLevelBookmarkName)) {
                validationStatus = ValidationResult.ERROR;
                isPrintErrorOrWarn
                    ? lge(`Duplicate Dealer level bookmark name found, a folder '${dealerLevelBookmarkName}' is already present.`)
                    : null;
                dealerLevelBookmarkToRemove.push(dealerLevelBookmarkIndex);
            } else {
                dealerLevelBookmarkNames.push(dealerLevelBookmarkName);
            }
            dealerLevelBookmarkIndex++;
        }
        // Remove elements in reverse order to avoid index shifting
        for (let i = dealerLevelBookmarkToRemove.length - 1; i >= 0; i--) {
            dealerLevelBookmarks.splice(dealerLevelBookmarkToRemove[i], 1);
        }
    }
    /* #endregion */

    debug ? lgd(`Validating bookmarks and checking if credentials are present: Done.`) : null;
    return [validationStatus, allUsernamesBookmarks];
}

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
export { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText };
