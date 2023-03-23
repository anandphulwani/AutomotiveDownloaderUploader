import chalk from 'chalk';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername } from './configsupportive.js';
import { setCurrentDealerConfiguration, getAllDealerNumbers } from './excelsupportive.js';
import { checkForSpaceInBeginOrEnd, checkForMultipleSpacesInMiddle, allTrimString, trimMultipleSpacesInMiddleIntoOne } from './stringformatting.js';
/* eslint-enable import/extensions */

function validateBookmarksAndCheckCredentialsPresent(debug = false) {
    let validationStatus = 'success';
    debug ? console.log(`Validating bookmarks and checking if credentials are present: Executing.`) : '';
    const { bookmarkPath, bookmarkOptions } = config;
    const bookmarks = getChromeBookmark(bookmarkPath, bookmarkOptions);
    // eslint-disable-next-line no-restricted-syntax
    for (const topLevelBookmark of bookmarks) {
        if (topLevelBookmark.name === 'Bookmarks bar') {
            console.log(chalk.cyan('Validating Bookmarks bar from the bookmarks data.'));
            const usernameLevelBookmarks = topLevelBookmark.children;
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameLevelBookmark of usernameLevelBookmarks) {
                console.log(chalk.cyan(`Validating Bookmarks for the Username: ${chalk.cyan.bold(usernameLevelBookmark.name)}`));
                const credentials = getCredentialsForUsername(usernameLevelBookmark.name);
                if (credentials === undefined) {
                    validationStatus = 'error';
                    console.log(
                        chalk.white.bgRed.bold(
                            `ERROR: Credentials for ${usernameLevelBookmark.name} not found in config file, Please declare in config.`
                        )
                    );
                }
                setCurrentDealerConfiguration(usernameLevelBookmark.name);
                const dealerLevelBookmarks = usernameLevelBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const allDealerNumbers = getAllDealerNumbers();
                    const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameLevelBookmark.name);
                    if (!allDealerNumbers.includes(dealerLevelBookmarkName)) {
                        validationStatus = 'error';
                        console.log(
                            chalk.white.bgRed.bold(
                                `ERROR: Unable to find dealer folder: ${dealerLevelBookmarkName} for the Username: ${usernameLevelBookmark.name}, it is not present in the excel.`
                            )
                        );
                    }
                }
            }
        }
    }
    debug ? console.log(`Validating excel file: Done.`) : '';
    return validationStatus;
}

function validateBookmarkNameText(dealerLevelBookmarkName, username) {
    checkForSpaceInBeginOrEndOfBookmarkName(dealerLevelBookmarkName, username);
    dealerLevelBookmarkName = allTrimString(dealerLevelBookmarkName);
    checkForMultipleSpacesInMiddleOfBookmarkName(dealerLevelBookmarkName, username);
    dealerLevelBookmarkName = trimMultipleSpacesInMiddleIntoOne(dealerLevelBookmarkName);
    return dealerLevelBookmarkName;
}

function checkForSpaceInBeginOrEndOfBookmarkName(dealerLevelBookmarkName, username) {
    if (!checkForSpaceInBeginOrEnd(dealerLevelBookmarkName)) {
        console.log(
            chalk.white.bgYellow.bold(
                `WARNING: Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found space(s) in beginning and/or the end of bookmark name.\n`
            )
        );
    }
}

function checkForMultipleSpacesInMiddleOfBookmarkName(dealerLevelBookmarkName, username) {
    if (!checkForMultipleSpacesInMiddle(dealerLevelBookmarkName)) {
        console.log(
            chalk.white.bgYellow.bold(
                `WARNING: Under bookmark for user '${username}' in dealer folder '${dealerLevelBookmarkName}', found multiple consecutive space in middle of bookmark name.\n`
            )
        );
    }
}

// eslint-disable-next-line import/prefer-default-export
export { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText };
