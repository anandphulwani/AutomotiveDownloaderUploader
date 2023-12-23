import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { lge, lgc, lgi, lgif, lgu, lgd, lgwc } from './functions/loggerandlocksupportive.js';
import { createProcessingAndRecordKeepingFolders } from './functions/configsupportive.js';
import { createDirAndCopyFile, createDirAndMoveFile, getFileCountRecursively, getFolderSizeInBytes, removeDir } from './functions/filesystem.js';
import { getNumberOfImagesFromAllottedDealerNumberFolder } from './functions/datastoresupportive.js';
import { waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer from './functions/contractors_workdonefile.js';
import { moveFilesFromSourceToDestinationAndAccounting, validationBeforeMoving } from './functions/contractors_folderTransferersupportive.js';
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
    process.exit(1);
}
// TODO: validate config file here
// TODO: Delete accounting folders for last 5 dates only.

// const cuttingDone = config.cutterProcessingFolders[0];
// const finishingBuffer = config.finisherProcessingFolders[0];
// const readyToUpload = config.finisherProcessingFolders[1];

// const cuttingAccounting = config.cutterRecordKeepingFolders[0];
// const finishingAccounting = config.finisherRecordKeepingFolders[0];

let lastLockTime = Date.now();
// eslint-disable-next-line no-constant-condition
while (true) {
    createProcessingAndRecordKeepingFolders(instanceRunDateFormatted);

    let foldersToShift = validationBeforeMoving('finishingBuffer', undefined, debug);

    foldersToShift = moveFilesFromSourceToDestinationAndAccounting('finishingBuffer', foldersToShift, true);
    moveFilesFromSourceToDestinationAndAccounting('finishingBuffer', foldersToShift, false);
    checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer();

    /**
     * Check if downloader and uploader is not running for 2 hours,
     * if yes then exit the script
     */
    const downloaderLocked = checkSync('downloader.js', { stale: 15000 });
    const uploaderLocked = checkSync('uploader.js', { stale: 15000 });
    if (downloaderLocked && uploaderLocked) {
        lastLockTime = Date.now();
    } else if (Date.now() - lastLockTime > 2 * 60 * 60 * 1000 /* 2 hours in milliseconds */) {
        break;
    }
    await waitForSeconds(30);
}
