import { checkSync, lockSync } from 'proper-lockfile';
import cfonts from 'cfonts';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { lge, lgi, lgu, lgwc } from './functions/loggerandlocksupportive.js';
import { createProcessingAndRecordKeepingFolders } from './functions/configsupportive.js';
import { waitForSeconds } from './functions/sleep.js';
import checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer from './functions/contractors_workdonefile.js';
import { moveFilesFromSourceToDestinationAndAccounting, validationBeforeMoving } from './functions/contractors_folderTransferersupportive.js';
import Color from './class/Colors.js';
import { validateConfigFile } from './functions/configvalidation.js';
import { validateDealerConfigurationExcelFile } from './functions/excelvalidation.js';
import { validateBookmarksAndCheckCredentialsPresent } from './functions/bookmarkvalidation.js';
/* eslint-enable import/extensions */

/**
 *
 * 001_CuttingDone: Once cutting is done in the 'ContractorFolder', move folder to this folder, from this folder gets moved to '002_CuttingAccounting' and '003_FinishingBuffer'.
 * 002_CuttingAccounting: 'Cutting' done, for record keeping.
 * 003_FinishingBuffer: For 'Finishing' work, buffer folder, once work is done, shift to '004_ReadyToUpload'.
 * 004_ReadyToUpload: To transfer folder to Uploading zone to the software.
 * 005_FinishingAccounting: 'Finishing' done, for record keeping.
 *
 * Folder Structure::
 * ContractorFolder:
 *      |--- Today's Date
 *                       |--- 001_CuttingDone
 *                       |--- 003_FinishingBuffer
 *                       |--- 004_ReadyToUpload
 *
 * ContractorRecordKeepingFolder:
 *      |--- 002_CuttingAccounting
 *                       |--- Today's Date
 *      |--- 005_FinishingAccounting
 *                       |--- Today's Date
 *
 *
 * Process:
 *
 *                                                                                     002_CuttingAccounting
 *                                                                                   🡵
 *     ContractorFolder ---(Cutting Done)---> 001_CuttingDone ---(Automatic)--->  003_FinishingBuffer -------------
 *
 *
 *                                                                                         005_FinishingAccounting
 *                                                                                       🡵
 *                      ---------(Finishing Done)---> 004_ReadyToUpload ---(Automatic)---> UploadingZone
 *
 * Moving actions:
 *         01. 001_CuttingDone to 002_CuttingAccounting, 003_FinishingBuffer. (Handled by this file)
 *         02. 004_ReadyToUpload to UploadingZone, 005_FinishingAccounting. (Handled by Uploader.js)
 *
 */

const debug = false;
/**
 *
 * Only make a single instance run of the script.
 *
 */
try {
    if (checkSync('contractors_folderTransferer.js', { stale: 15000 })) {
        lgwc('Lock already held, another instace is already running.');
        process.exit(1);
    }
    lockSync('contractors_folderTransferer.js', { stale: 15000 });
} catch (error) {
    lgu('Unable to checkSync or lockSync.', error);
    process.exit(1);
}
// TODO: Delete accounting folders for last 5 dates only.

if (
    [
        validateConfigFile() === 'error',
        validateDealerConfigurationExcelFile() === 'error',
        validateBookmarksAndCheckCredentialsPresent() === 'error',
    ].some((i) => i)
) {
    lge(`Please correct the above errors, in order to continue.`);
    if (config.environment === 'production') {
        process.exit(1);
    }
}

const headingOptions = {
    font: 'block', // font to use for the output
    align: 'center', // alignment of the output
    colors: ['cyan', 'blue'], // colors of the output (gradient)
    background: 'black', // background color of the output
    letterSpacing: 1, // letter spacing of the output
    lineHeight: 0, // line height of the output
    space: false, // add space between letters
    maxLength: '0', // maximum length of the output (0 = unlimited)
};

cfonts.say(`Folder`, headingOptions);
cfonts.say(`Transferer`, headingOptions);
console.log('');

let lastLockTime = Date.now();
// eslint-disable-next-line no-constant-condition
while (true) {
    createProcessingAndRecordKeepingFolders(instanceRunDateFormatted);

    let foldersToShift = validationBeforeMoving('finishingBuffer', undefined, debug);

    foldersToShift = moveFilesFromSourceToDestinationAndAccounting('finishingBuffer', foldersToShift, true);
    moveFilesFromSourceToDestinationAndAccounting('finishingBuffer', foldersToShift, false);
    checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer();

    /**
     * Check if downloader or uploader is not running for 2 hours,
     * if yes then exit the script
     */
    const downloaderLocked = checkSync('downloader.js', { stale: 15000 });
    const uploaderLocked = checkSync('uploader.js', { stale: 15000 });
    if (downloaderLocked || uploaderLocked) {
        lastLockTime = Date.now();
    } else if (Date.now() - lastLockTime > 2 * 60 * 60 * 1000 /* 2 hours in milliseconds */) {
        break;
    }
    await waitForSeconds(30);
}
lgi('Program has ended successfully.', Color.bgWhite);
