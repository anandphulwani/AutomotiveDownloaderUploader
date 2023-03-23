import chalk from 'chalk';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername } from './configsupportive.js';
import { setCurrentDealerConfiguration, getAllDealerNames } from './excelsupportive.js';
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
                setCurrentDealerConfiguration(credentials.username);
                const dealerLevelBookmarks = usernameLevelBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const allDealerNames = getAllDealerNames();
                    if (!allDealerNames.includes(dealerLevelBookmark.name)) {
                        validationStatus = 'error';
                        console.log(
                            chalk.white.bgRed.bold(
                                `ERROR: Unable to find dealer folder: ${dealerLevelBookmark.name} for the Username: ${usernameLevelBookmark.name}, it is not present in the excel.`
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

// eslint-disable-next-line import/prefer-default-export
export { validateBookmarksAndCheckCredentialsPresent };
