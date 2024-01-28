/* eslint-disable import/extensions */
import { waitForSeconds } from './sleep.js';
import { downloadBookmarksFromSourceToProcessing } from './bookmark.js';
import { validateDealerConfigurationExcelFile } from './excelvalidation.js';
import { validateBookmarksAndCheckCredentialsPresent } from './bookmarkvalidation.js';
import { lge } from './loggerandlocksupportive.js';
import { clearLastLinesOnConsole } from './consolesupportive.js';
import { getRowPosOnTerminal } from './terminal.js';
import { validateConfigFile } from './configvalidation.js';
import ValidationResult from '../class/ValidationResult.js';
/* eslint-enable import/extensions */

async function waitForValidationErrorsToResolve(scriptFilename, isInitialRun) {
    const inLoopRowBeforeValidation = await getRowPosOnTerminal();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        let isValidationFailed = false;
        if (isInitialRun) {
            isValidationFailed = validateConfigFile() === 'error';
        }

        if (!isValidationFailed) {
            if (scriptFilename === 'downloader.js') {
                await downloadBookmarksFromSourceToProcessing();
            }
            if (scriptFilename === 'downloader.js' || scriptFilename === 'uploader.js' || scriptFilename === 'contractors_folderTransferer.js') {
                const isValidateBookmarksAndCheckCredentialsPresent = validateBookmarksAndCheckCredentialsPresent(true);
                isValidationFailed = [
                    validateDealerConfigurationExcelFile() === 'error',
                    isValidateBookmarksAndCheckCredentialsPresent[0] !== undefined &&
                        isValidateBookmarksAndCheckCredentialsPresent[0] === ValidationResult.ERROR,
                ].some((i) => i);
            }
        }

        if (isValidationFailed) {
            lge(`Please correct the above errors, in order to continue.`);
            await waitForSeconds(30);

            clearLastLinesOnConsole((await getRowPosOnTerminal()) - inLoopRowBeforeValidation);

            // eslint-disable-next-line no-continue
            continue;
        }
        break;
    }
}

// eslint-disable-next-line import/prefer-default-export
export { waitForValidationErrorsToResolve };
