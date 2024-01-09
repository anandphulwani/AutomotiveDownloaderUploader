import chalk from 'chalk';
import path from 'path';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername } from './configsupportive.js';
import { getAllDealerNumbers } from './excelsupportive.js';
import { lgd, lge } from './loggerandlocksupportive.js';
/* eslint-enable import/extensions */

function validateConfigFile(debug = false) {
    let validationStatus = 'success';
    debug
        ? lgd(`Making sure that 'config.sourceBookmarkFilePath' and 'config.processingBookmarkWithoutSyncFilePath' are not same file: Executing.`)
        : null;
    const { sourceBookmarkFilePath, processingBookmarkWithoutSyncFilePath } = config;
    if (path.resolve(sourceBookmarkFilePath) === path.resolve(processingBookmarkWithoutSyncFilePath)) {
        validationStatus = 'error';
        lge(`Config's 'sourceBookmarkFilePath' and Config's 'processingBookmarkWithoutSyncFilePath' are reflecting the same file.`);
        return validationStatus;
    }
    debug
        ? lgd(`Making sure that 'config.sourceBookmarkFilePath' and 'config.processingBookmarkWithoutSyncFilePath' are not same file: Done.`)
        : null;

    debug ? lgd(`Validating bookmarks and checking if credentials are present: Executing.`) : null;
    validationStatus = 'success';
    // ONPROJECTFINISH: Complete the validation of config file.
    // Check every contractor has a finisher which exists itself as a contractor.
    // Check every contractor has all required elements including finisher
    // validationStatus = 'error';
    debug ? lgd(`Validating excel file: Done.`) : null;
    return validationStatus;
}

// eslint-disable-next-line import/prefer-default-export
export { validateConfigFile };
