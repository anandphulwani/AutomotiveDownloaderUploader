/* eslint-disable import/extensions */
import { getAllUsernamesBookmarks } from './bookmarksupportive.js';
import { setCurrentDealerConfiguration, getAllDealerNumbers } from './excelsupportive.js';
import { checkForSpaceInBeginOrEnd, checkForMultipleSpacesInMiddle, allTrimString, trimMultipleSpacesInMiddleIntoOne } from './stringformatting.js';
import { lgd, lge, lgw } from './loggerandlocksupportive.js';
/* eslint-enable import/extensions */

function validateBookmarksAndCheckCredentialsPresent(debug = false) {
    let validationStatus = 'success';
    debug ? lgd(`Validating bookmarks and checking if credentials are present: Executing.`) : null;
    const allUsernamesBookmarks = getAllUsernamesBookmarks();
    const uniqueUsernamesBookmarks = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        const uniqueUsernamesArr = uniqueUsernamesBookmarks.map((uniqueUsernameBookmark) => uniqueUsernameBookmark.name);
        if (uniqueUsernamesArr.includes(usernameBookmark.name)) {
            validationStatus = 'error';
            lge(`Duplicate Username level bookmark name found, a folder '${usernameBookmark.name}' is already present.`);
        } else {
            uniqueUsernamesBookmarks.push(usernameBookmark);
        }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of uniqueUsernamesBookmarks) {
        setCurrentDealerConfiguration(usernameBookmark.name);
        const allDealerNumbers = getAllDealerNumbers();
        const dealerLevelBookmarks = usernameBookmark.children;
        const dealerLevelBookmarkNames = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of dealerLevelBookmarks) {
            const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
            if (!allDealerNumbers.includes(dealerLevelBookmarkName)) {
                validationStatus = 'error';
                lge(
                    `Unable to find dealer folder: '${dealerLevelBookmarkName}' for the Username: '${usernameBookmark.name}', it is not present in the excel.`
                );
            }
            if (dealerLevelBookmarkNames.includes(dealerLevelBookmarkName)) {
                validationStatus = 'error';
                lge(`Duplicate Dealer level bookmark name found, a folder ${dealerLevelBookmarkName} is already present.`);
            } else {
                dealerLevelBookmarkNames.push(dealerLevelBookmarkName);
            }
        }
    }
    debug ? lgd(`Validating bookmarks and checking if credentials are present: Done.`) : null;
    return validationStatus;
}

function validateBookmarkNameText(dealerLevelBookmarkName, username) {
    dealerLevelBookmarkName = dealerLevelBookmarkName.includes(' |#| ') ? dealerLevelBookmarkName.split(' |#| ')[0] : dealerLevelBookmarkName;
    checkForSpaceInBeginOrEndOfBookmarkName(dealerLevelBookmarkName, username);
    dealerLevelBookmarkName = allTrimString(dealerLevelBookmarkName);
    checkForMultipleSpacesInMiddleOfBookmarkName(dealerLevelBookmarkName, username);
    dealerLevelBookmarkName = trimMultipleSpacesInMiddleIntoOne(dealerLevelBookmarkName);
    return dealerLevelBookmarkName;
}

function checkForSpaceInBeginOrEndOfBookmarkName(dealerLevelBookmarkName, username) {
    if (checkForSpaceInBeginOrEnd(dealerLevelBookmarkName)) {
        lgw(
            `Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found space(s) in beginning and/or the end of bookmark name.`
        );
    }
}

function checkForMultipleSpacesInMiddleOfBookmarkName(dealerLevelBookmarkName, username) {
    if (checkForMultipleSpacesInMiddle(dealerLevelBookmarkName)) {
        lgw(
            `Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found multiple consecutive space in middle of bookmark name.`
        );
    }
}

// eslint-disable-next-line import/prefer-default-export
export { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText };
