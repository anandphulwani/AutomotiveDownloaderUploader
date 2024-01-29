import fs from 'fs';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lge } from './loggerandlocksupportive.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
import { getUsernameTrimmed } from './excelsupportive.js';
/* eslint-enable import/extensions */

let lastSourceBookmarksFileModifiedTime = '';
const lastDealerExcelModifiedTime = {};

function hasBookmarkSourceFileOrExcelFileChanged() {
    let isBookmarkSourceFileOrExcelFileChanged = false;
    const { sourceBookmarksFilePath } = config;
    if (!syncOperationWithErrorHandling(fs.existsSync, sourceBookmarksFilePath)) {
        lge(`Source Bookmarks file: ${sourceBookmarksFilePath} does not exist, Please check.`);
        process.exit(1);
    }
    const sourceBookmarksFilePathStats = syncOperationWithErrorHandling(fs.statSync, sourceBookmarksFilePath);
    if (lastSourceBookmarksFileModifiedTime !== String(sourceBookmarksFilePathStats.mtime)) {
        lastSourceBookmarksFileModifiedTime = String(sourceBookmarksFilePathStats.mtime);
        isBookmarkSourceFileOrExcelFileChanged = true;
    }

    const allUsernamesFromConfig = config.credentials.map((item) => getUsernameTrimmed(item.username));
    // eslint-disable-next-line no-restricted-syntax
    for (const username of allUsernamesFromConfig) {
        const usernameTrimmed = getUsernameTrimmed(username);
        const excelFilename = `${config.dealerConfigurationPath}\\${usernameTrimmed}.xlsx`;
        if (!syncOperationWithErrorHandling(fs.existsSync, excelFilename)) {
            lge(`Dealer configuration excel file: ${excelFilename} does not exist, Please check.`);
            process.exit(1);
        }
        const excelFilenameStats = syncOperationWithErrorHandling(fs.statSync, excelFilename);
        if (lastDealerExcelModifiedTime[username] !== String(excelFilenameStats.mtime)) {
            lastDealerExcelModifiedTime[username] = String(excelFilenameStats.mtime);
            isBookmarkSourceFileOrExcelFileChanged = true;
        }
    }

    return isBookmarkSourceFileOrExcelFileChanged;
}

// eslint-disable-next-line import/prefer-default-export
export { hasBookmarkSourceFileOrExcelFileChanged };
