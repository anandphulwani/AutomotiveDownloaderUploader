import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lge } from './loggerandlocksupportive.js';
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

function getRemainingBookmarksNotDownloaded() {
    const allUsernamesBookmarks = getAllUsernamesBookmarks();
    // Filter out bookmarks based on vehicleBookmark condition
    const filteredBookmarks = allUsernamesBookmarks
        .map((usernameBookmark) => ({
            ...usernameBookmark,
            children: usernameBookmark.children
                .map((dealerLevelBookmark) => ({
                    ...dealerLevelBookmark,
                    children: dealerLevelBookmark.children.filter((vehicleBookmark) => !vehicleBookmark.name.includes('|#|')),
                }))
                .filter((dealerLevelBookmark) => dealerLevelBookmark.children.length > 0),
        }))
        .filter((usernameBookmark) => usernameBookmark.children.length > 0);
    return filteredBookmarks;
}

function getRemainingBookmarksNotDownloadedLength() {
    return getRemainingBookmarksNotDownloaded().reduce(
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

// eslint-disable-next-line import/prefer-default-export
export {
    getAllUsernamesBookmarks,
    getRemainingBookmarksNotDownloaded,
    getRemainingBookmarksNotDownloadedLength,
    getUniqueIDsOfBookmarkFoldersAllotted,
};
