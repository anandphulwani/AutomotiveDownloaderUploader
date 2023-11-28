import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { lgw, lge, lgc, lgi, lgif, lgu, lgd } from './functions/loggerandlocksupportive.js';
import { createProcessingAndRecordKeepingFolders } from './functions/configsupportive.js';
import { createDirAndCopyFile, createDirAndMoveFile, getFileCountRecursively, getFolderSizeInBytes, removeDir } from './functions/filesystem.js';
import { getNumberOfImagesFromAllottedDealerNumberFolder } from './functions/datastoresupportive.js';
import { waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import {
    checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer,
    moveFilesFromSourceToDestinationAndAccounting,
} from './functions/contractors_folderTransferersupportive.js';
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
// TODO: Copy this to downloader, uploader, genreate excel script as well
/**
 *
 * Only make a single instance run of the script.
 *
 */
try {
    if (checkSync('contractors_folderTransferer.js', { stale: 15000 })) {
        throw new Error('Already has lock');
    }
    lockSync('contractors_folderTransferer.js', { stale: 15000 });
} catch (error) {
    process.exit(1);
}
// TODO: validate config file here
// TODO: Delete accounting folders for last 5 dates only.

const cuttingDone = config.cutterProcessingFolders[0];
const finishingBuffer = config.finisherProcessingFolders[0];
// const readyToUpload = config.finisherProcessingFolders[1];

const cuttingAccounting = config.cutterRecordKeepingFolders[0];
// const finishingAccounting = config.finisherRecordKeepingFolders[0];

const historyOfWarnings = [new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set(), new Set()]; // Array of sets for the last three iterations

// eslint-disable-next-line no-constant-condition
while (true) {
    const currentSetOfWarnings = new Set();
    createProcessingAndRecordKeepingFolders(instanceRunDateFormatted);

    let foldersToShift = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const cutter of Object.keys(config.contractors)) {
        const cutterCuttingDoneDir = `${config.contractorsZonePath}\\${cutter}\\${instanceRunDateFormatted}\\${cuttingDone}`;
        // Check CuttingDone folder exists.
        if (!fs.existsSync(cutterCuttingDoneDir)) {
            lgw(`Cutter's CuttingDone folder doesn't exist: ${cutterCuttingDoneDir}, Ignoring.`);
            // eslint-disable-next-line no-continue
            continue;
        }

        // Get all the folders which are not holding any locks
        const unlockedFolders = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const cutterCuttingDoneSubFolderAndFiles of fs.readdirSync(cutterCuttingDoneDir)) {
            const cutterCuttingDoneSubFolderPath = path.join(cutterCuttingDoneDir, cutterCuttingDoneSubFolderAndFiles);
            const cutterCuttingDoneStat = fs.statSync(cutterCuttingDoneSubFolderPath);
            if (cutterCuttingDoneStat.isDirectory()) {
                try {
                    fs.renameSync(cutterCuttingDoneSubFolderPath, `${cutterCuttingDoneSubFolderPath} `);
                    fs.renameSync(`${cutterCuttingDoneSubFolderPath} `, cutterCuttingDoneSubFolderPath.trim());
                    unlockedFolders.push(cutterCuttingDoneSubFolderAndFiles);
                } catch (err) {
                    currentSetOfWarnings.add(
                        `Folder in Cutter's CuttingDone locked, maybe a contractor working/moving it, Filename: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Ignoring.`
                    );
                }
            }
        }

        // eslint-disable-next-line no-restricted-syntax
        for (let cutterCuttingDoneSubFolderAndFiles of unlockedFolders) {
            let isOverwrite = false;
            let cutterCuttingDoneSubFolderPath = path.join(cutterCuttingDoneDir, cutterCuttingDoneSubFolderAndFiles);
            const cutterCuttingDoneStat = fs.statSync(cutterCuttingDoneSubFolderPath);
            // Check CuttingDone item is a folder
            if (!cutterCuttingDoneStat.isDirectory()) {
                currentSetOfWarnings.add(
                    `Found a file in Cutter's CuttingDone directory, Filename: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Ignoring.`
                );
                // eslint-disable-next-line no-continue
                continue;
            }

            // Check CuttingDone folder has OK_AlreadyMoved_ prefixed to it, if has set overwrite to true and rename the folder to proper format
            const regexallottedFolderAlreadyMovedRegexString = config.allottedFolderRegex.replace('^', '^[O|o][K|k]_AlreadyMoved_');
            const regexallottedFolderAlreadyMovedRegexExpression = new RegExp(regexallottedFolderAlreadyMovedRegexString, 'g');
            if (regexallottedFolderAlreadyMovedRegexExpression.test(cutterCuttingDoneSubFolderAndFiles)) {
                const folderWithOkAlreadMovedRemoved = path.basename(cutterCuttingDoneSubFolderPath).replace(/^[O|o][K|k]_AlreadyMoved_/, '');
                const newCutterCuttingDoneSubFolderPath = `${path.dirname(cutterCuttingDoneSubFolderPath)}/${folderWithOkAlreadMovedRemoved}`;
                fs.renameSync(cutterCuttingDoneSubFolderPath, newCutterCuttingDoneSubFolderPath);
                cutterCuttingDoneSubFolderAndFiles = folderWithOkAlreadMovedRemoved;
                cutterCuttingDoneSubFolderPath = path.join(cutterCuttingDoneDir, cutterCuttingDoneSubFolderAndFiles);
                isOverwrite = true;
            }

            // Check CuttingDone folder has AlreadyMoved_ prefixed to it, if has ignore the folder
            if (/^AlreadyMoved_.*$/.test(cutterCuttingDoneSubFolderAndFiles)) {
                // eslint-disable-next-line no-continue
                continue;
            }

            // Check CuttingDone folder matches the format
            const regexallottedFolderRegexExpression = new RegExp(config.allottedFolderRegex, 'g');
            if (!regexallottedFolderRegexExpression.test(cutterCuttingDoneSubFolderAndFiles)) {
                currentSetOfWarnings.add(
                    `Folder in CuttingDone but is not in a proper format, Folder: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Ignoring.`
                );
                // eslint-disable-next-line no-continue
                continue;
            }
            const numberOfImagesAcToFolderName = parseInt(getNumberOfImagesFromAllottedDealerNumberFolder(cutterCuttingDoneSubFolderAndFiles), 10);
            const numberOfImagesAcToFileCount = getFileCountRecursively(cutterCuttingDoneSubFolderPath);
            // Check CuttingDone folder filecount matches as mentioned in the folder
            if (numberOfImagesAcToFolderName !== numberOfImagesAcToFileCount) {
                currentSetOfWarnings.add(
                    `Folder in CuttingDone but images quantity does not match, Folder: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Images Qty ac to folder name: ${numberOfImagesAcToFolderName} and  Images Qty present in the folder: ${numberOfImagesAcToFileCount}, Ignoring.`
                );
                // eslint-disable-next-line no-continue
                continue;
            }
            const folderSize = getFolderSizeInBytes(cutterCuttingDoneSubFolderPath);
            foldersToShift.push({
                dealerImagesFolder: cutterCuttingDoneSubFolderPath,
                folderSize: folderSize,
                cutter: cutter,
                isOverwrite: isOverwrite,
            });
        }
    }

    foldersToShift.sort((a, b) => {
        const regex = /(\d+)/;
        if (!regex.test(path.basename(a.dealerImagesFolder)) || !regex.test(path.basename(b.dealerImagesFolder))) {
            lgu('Unable to match regex of `foldersToShift` while sorting.');
            return 0;
        }
        const numA = Number(path.basename(a.dealerImagesFolder).match(regex)[0]);
        const numB = Number(path.basename(b.dealerImagesFolder).match(regex)[0]);
        return numA - numB;
    });
    // TODO: This sleep was induced to check folderSizeAfter10Seconds functionality, to be removed if the above locking system works properly.
    // sleep(15);
    debug ? lgd(`foldersToShift: ${foldersToShift}`) : null;

    // TODO: Check which warning we can give immediately
    historyOfWarnings.shift();
    historyOfWarnings.push(currentSetOfWarnings);
    // eslint-disable-next-line no-restricted-syntax
    for (const warning of currentSetOfWarnings) {
        if (
            historyOfWarnings[0].has(warning) &&
            historyOfWarnings[1].has(warning) &&
            historyOfWarnings[2].has(warning) &&
            historyOfWarnings[3].has(warning) &&
            historyOfWarnings[4].has(warning) &&
            historyOfWarnings[5].has(warning) &&
            historyOfWarnings[6].has(warning) &&
            historyOfWarnings[7].has(warning) &&
            historyOfWarnings[8].has(warning) &&
            historyOfWarnings[9].has(warning)
        ) {
            lgw(warning);
            historyOfWarnings[0].delete(warning);
            historyOfWarnings[1].delete(warning);
            historyOfWarnings[2].delete(warning);
            historyOfWarnings[3].delete(warning);
            historyOfWarnings[4].delete(warning);
            historyOfWarnings[5].delete(warning);
            historyOfWarnings[6].delete(warning);
            historyOfWarnings[7].delete(warning);
            historyOfWarnings[8].delete(warning);
            historyOfWarnings[9].delete(warning);
        }
    }

    foldersToShift = moveFilesFromSourceToDestinationAndAccounting('finishingBuffer', foldersToShift, true);
    moveFilesFromSourceToDestinationAndAccounting('finishingBuffer', foldersToShift, false);
    checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer();
    await waitForSeconds(30);
}
