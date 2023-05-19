import chalk from 'chalk';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername } from './configsupportive.js';
import { getAllUsernamesBookmarks } from './bookmarksupportive.js';
import { setCurrentDealerConfiguration, getAllDealerNumbers } from './excelsupportive.js';
import { checkForSpaceInBeginOrEnd, checkForMultipleSpacesInMiddle, allTrimString, trimMultipleSpacesInMiddleIntoOne } from './stringformatting.js';
/* eslint-enable import/extensions */

function validateBookmarksAndCheckCredentialsPresent(debug = false) {
    let validationStatus = 'success';
    debug ? console.log(`Validating bookmarks and checking if credentials are present: Executing.`) : '';
    const allUsernamesBookmarks = getAllUsernamesBookmarks();
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        setCurrentDealerConfiguration(usernameBookmark.name);
        const allDealerNumbers = getAllDealerNumbers();
        const dealerLevelBookmarks = usernameBookmark.children;
        const dealerLevelBookmarkNames = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of dealerLevelBookmarks) {
            const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
            if (!allDealerNumbers.includes(dealerLevelBookmarkName)) {
                validationStatus = 'error';
                console.log(
                    chalk.white.bgRed.bold(
                        `ERROR: Unable to find dealer folder: '${dealerLevelBookmarkName}' for the Username: '${usernameBookmark.name}', it is not present in the excel.`
                    )
                );
            }
            if (dealerLevelBookmarkNames.includes(dealerLevelBookmarkName)) {
                validationStatus = 'error';
                console.log(
                    chalk.white.bgRed.bold(
                        `ERROR: Duplicate Dealer level bookmark name found, a folder ${dealerLevelBookmarkName} is already present.`
                    )
                );
            } else {
                dealerLevelBookmarkNames.push(dealerLevelBookmarkName);
            }
        }
    }
    debug ? console.log(`Validating excel file: Done.`) : '';
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
        console.log(
            chalk.white.bgYellow.bold(
                `WARNING: Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found space(s) in beginning and/or the end of bookmark name.\n`
            )
        );
    }
}

function checkForMultipleSpacesInMiddleOfBookmarkName(dealerLevelBookmarkName, username) {
    if (checkForMultipleSpacesInMiddle(dealerLevelBookmarkName)) {
        console.log(
            chalk.white.bgYellow.bold(
                `WARNING: Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found multiple consecutive space in middle of bookmark name.\n`
            )
        );
    }
}

// eslint-disable-next-line import/prefer-default-export
export { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText };
