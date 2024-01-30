import { URL as URLparser } from 'url';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lgd, lge } from './loggerandlocksupportive.js';
import { validateExcelValuesForDealerNumber } from './excelvalidation.js';
import { setCurrentDealerConfiguration, getAllDealerNumbers } from './excelsupportive.js';
import ValidationResult from '../class/ValidationResult.js';
import { validateBookmarkNameText } from './bookmarkvalidation.js';
/* eslint-enable import/extensions */

function getAllUsernamesBookmarks() {
    const { processingBookmarksWithoutSyncFilePath, bookmarkOptions } = config;
    const bookmarks = getChromeBookmark(processingBookmarksWithoutSyncFilePath, bookmarkOptions);

    let bookmarksBarData = bookmarks.filter((topLevelBookmark) => topLevelBookmark.name === 'Bookmarks bar');
    if (bookmarksBarData.length <= 0) {
        lge(`Bookmarks section doesn't contain bookmarks bar.`);
        process.exit(1);
    } else if (bookmarksBarData.length > 1) {
        bookmarksBarData = bookmarksBarData.reduce((earliest, current) => {
            const earliestDateAdded = parseInt(earliest.date_added, 10);
            const currentDateAdded = parseInt(current.date_added, 10);
            return earliestDateAdded < currentDateAdded ? earliest : current;
        });
        bookmarksBarData = [bookmarksBarData];
    }
    const bookmarksBarDataChildren = bookmarksBarData[0].children;
    const allUsernamesFromConfig = config.credentials.map((item) => item.username);
    const allUsernamesBookmarks = bookmarksBarDataChildren.filter((usernameLevelBookmark) =>
        allUsernamesFromConfig.includes(usernameLevelBookmark.name)
    );
    if (!allUsernamesBookmarks.length > 0) {
        lge(`Bookmarks bar doesn't contain folders of the usernames available in the config.`);
        process.exit(1);
    }
    return allUsernamesBookmarks;
}

function validateAllBookmarksAndReturnValidatedBookmarks(isPrintErrorOrWarn, debug = false) {
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

function getRemainingBookmarksNotDownloaded(isValidBookmarksOnly) {
    const allUsernamesBookmarks = isValidBookmarksOnly ? validateAllBookmarksAndReturnValidatedBookmarks() : getAllUsernamesBookmarks();
    // Filter out bookmarks based on vehicleBookmark condition
    const filteredBookmarks = allUsernamesBookmarks
        .map((usernameBookmark) => ({
            ...usernameBookmark,
            children: Array.isArray(usernameBookmark.children)
                ? usernameBookmark.children
                      .map((dealerLevelBookmark) => ({
                          ...dealerLevelBookmark,
                          children: Array.isArray(dealerLevelBookmark.children)
                              ? dealerLevelBookmark.children.filter((vehicleBookmark) => !vehicleBookmark.name.includes('|#|'))
                              : [],
                      }))
                      .filter((dealerLevelBookmark) => dealerLevelBookmark.children && dealerLevelBookmark.children.length > 0)
                : [],
        }))
        .filter((usernameBookmark) => usernameBookmark.children && usernameBookmark.children.length > 0);
    if (!isValidBookmarksOnly) {
        return filteredBookmarks;
    }
    // Filter out bookmarks based on excel validation
    return filteredBookmarks
        .map((usernameBookmark) => ({
            ...usernameBookmark,
            children: Array.isArray(usernameBookmark.children)
                ? usernameBookmark.children.filter((dealerLevelBookmark) => validateExcelValuesForDealerNumber(dealerLevelBookmark, usernameBookmark))
                : [],
        }))
        .filter((usernameBookmark) => usernameBookmark.children && usernameBookmark.children.length > 0);
}

function getRemainingBookmarksNotDownloadedLength(isValidBookmarksOnly) {
    return getRemainingBookmarksNotDownloaded(isValidBookmarksOnly).reduce(
        (total, usernameBookmark) =>
            // Sum up all the lengths of the vehicleBookmark arrays in each dealerLevelBookmark
            total + usernameBookmark.children.reduce((subtotal, dealerLevelBookmark) => subtotal + dealerLevelBookmark.children.length, 0),
        0
    );
}

function getUniqueIDsOfBookmarkFoldersAllotted() {
    const allUsernamesBookmarks = getAllUsernamesBookmarks();
    const extractedNames = [];
    allUsernamesBookmarks
        .map((usernameBookmark) => ({
            ...usernameBookmark,
            children: usernameBookmark.children
                .map((dealerLevelBookmark) => {
                    if (dealerLevelBookmark.name.includes(' |#| ')) {
                        const extractedText = dealerLevelBookmark.name.split(' |#| ')[1];
                        if (extractedText) {
                            extractedNames.push(extractedText);
                        }
                    }
                    return {
                        ...dealerLevelBookmark,
                        children: dealerLevelBookmark.children.filter((vehicleBookmark) => !vehicleBookmark.name.includes(' |#| ')),
                    };
                })
                .filter((dealerLevelBookmark) => dealerLevelBookmark.children.length > 0),
        }))
        .filter((usernameBookmark) => usernameBookmark.children.length > 0);
    return extractedNames;
}

// Create a set of all completed bookmarks to compare for duplicates
function getUrlsDownloaded() {
    const allUsernamesBookmarks = getAllUsernamesBookmarks();
    const urlsDownloaded = {};
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        const dealerLevelBookmarks = usernameBookmark.children;
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of dealerLevelBookmarks) {
            const vehicleBookmarks = dealerLevelBookmark.children;
            // eslint-disable-next-line no-restricted-syntax
            for (const vehicleBookmark of vehicleBookmarks) {
                if (vehicleBookmark.name.includes('|#|')) {
                    let vehicleBookmarkUrlWOQueryParams = new URLparser(vehicleBookmark.url);
                    vehicleBookmarkUrlWOQueryParams = vehicleBookmarkUrlWOQueryParams.host + vehicleBookmarkUrlWOQueryParams.pathname;
                    urlsDownloaded[vehicleBookmarkUrlWOQueryParams] = dealerLevelBookmark.name;
                }
            }
        }
    }
    return urlsDownloaded;
}

// eslint-disable-next-line import/prefer-default-export
export {
    getUrlsDownloaded,
    getAllUsernamesBookmarks,
    validateAllBookmarksAndReturnValidatedBookmarks,
    getRemainingBookmarksNotDownloadedLength,
    getUniqueIDsOfBookmarkFoldersAllotted,
};
