/* eslint-disable import/extensions */
import { waitForSeconds } from './sleep.js';
import { downloadBookmarksFromSourceToProcessing } from './bookmark.js';
import { validateDealerConfigurationExcelFile } from './excelvalidation.js';
import { lge } from './loggerandlocksupportive.js';
import { clearLastLinesOnConsole } from './consolesupportive.js';
import { getRowPosOnTerminal } from './terminal.js';
import { validateConfigFile } from './configvalidation.js';
import ValidationResult from '../class/ValidationResult.js';
import { validateAllBookmarksAndReturnValidatedBookmarks } from './bookmarksupportive.js';
/* eslint-enable import/extensions */

async function runValidationConfigBookmarksExcel(scriptFilename, isInitialRun) {
    // const inLoopRowBeforeValidation = await getRowPosOnTerminal();
    let validationResult = ValidationResult.SUCCESS;
    if (isInitialRun) {
        validationResult = Math.max(validationResult, validateConfigFile());
    }

    if (validationResult === ValidationResult.SUCCESS) {
        if (scriptFilename === 'downloader.js') {
            await downloadBookmarksFromSourceToProcessing();
        }
        if (scriptFilename === 'downloader.js' || scriptFilename === 'uploader.js' || scriptFilename === 'contractors_folderTransferer.js') {
            const isValidateDealerConfigurationExcelFile = validateDealerConfigurationExcelFile();
            const isValidateAllBookmarksAndReturnValidatedBookmarks = validateAllBookmarksAndReturnValidatedBookmarks(true)[0];
            validationResult = Math.max(validationResult, isValidateAllBookmarksAndReturnValidatedBookmarks, isValidateDealerConfigurationExcelFile);
        }
    }

    if (validationResult === ValidationResult.ERROR) {
        if (isInitialRun) {
            lge(`Please correct the above errors, in order to continue.`);
            process.exit(1);
        }
        // clearLastLinesOnConsole((await getRowPosOnTerminal()) - inLoopRowBeforeValidation);
    }
}

// eslint-disable-next-line import/prefer-default-export
export { runValidationConfigBookmarksExcel };
