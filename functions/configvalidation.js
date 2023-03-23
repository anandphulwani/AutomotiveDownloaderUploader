import chalk from 'chalk';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername } from './configsupportive.js';
import { getAllDealerNumbers } from './excelsupportive.js';
/* eslint-enable import/extensions */

function validateConfigFile(debug = false) {
    let validationStatus = 'success';
    debug ? console.log(`Validating bookmarks and checking if credentials are present: Executing.`) : '';
    validationStatus = 'success';
    // TODO: Complete the validation of config file.
    // validationStatus = 'error';
    debug ? console.log(`Validating excel file: Done.`) : '';
    return validationStatus;
}

// eslint-disable-next-line import/prefer-default-export
export { validateConfigFile };
