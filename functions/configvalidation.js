import chalk from 'chalk';
import path from 'path';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername } from './configsupportive.js';
import { getAllDealerNumbers } from './excelsupportive.js';
/* eslint-enable import/extensions */

function validateConfigFile(debug = false) {
    let validationStatus = 'success';
    debug
        ? console.log(`Making sure that 'config.sourceBookmarkPath' and 'config.processingBookmarkPathWithoutSync' are not same file: Executing.`)
        : '';
    const { sourceBookmarkPath, processingBookmarkPathWithoutSync } = config;
    if (path.resolve(sourceBookmarkPath) === path.resolve(processingBookmarkPathWithoutSync)) {
        validationStatus = 'error';
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: Config's 'sourceBookmarkPath' and Config's 'processingBookmarkPathWithoutSync' are reflecting the same file.`
            )
        );
        return validationStatus;
    }
    debug ? console.log(`Making sure that 'config.sourceBookmarkPath' and 'config.processingBookmarkPathWithoutSync' are not same file: Done.`) : '';

    debug ? console.log(`Validating bookmarks and checking if credentials are present: Executing.`) : '';
    validationStatus = 'success';
    // TODO: Complete the validation of config file.
    // validationStatus = 'error';
    debug ? console.log(`Validating excel file: Done.`) : '';
    return validationStatus;
}

// eslint-disable-next-line import/prefer-default-export
export { validateConfigFile };
