import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { lgw, lge, lgc } from './functions/loggersupportive.js';
import { createProcessingAndRecordKeepingFolders } from './functions/configsupportive.js';
import { createDirAndCopyFile, createDirAndMoveFile, getFileCountRecursively, getFolderSizeInBytes } from './functions/filesystem.js';
import { getNumberOfImagesFromAllottedDealerNumberFolder } from './functions/datastoresupportive.js';
import { waitForSeconds } from './functions/sleep.js';
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

// TODO: Copy this to downloader, uploader, genreate excel script as well
/**
 *
 * Only make a single instance run of the script.
 *
 */
try {
    if (checkSync('contractors_folderTransferer.js', { stale: 43200000 })) {
        throw new Error('Already has lock');
    }
    lockSync('contractors_folderTransferer.js', { stale: 43200000 });
} catch (error) {
    process.exit(1);
}
// TODO: validate config file here

const cuttingDone = config.cutterProcessingFolders[0];
const finishingBuffer = config.finisherProcessingFolders[0];
// const readyToUpload = config.finisherProcessingFolders[1]

const cuttingAccounting = config.cutterRecordKeepingFolders[0];
// const finishingAccounting = config.finisherRecordKeepingFolders[0];

async function moveFilesFromCuttingDoneToFinishingBufferCuttingAccounting(foldersToShift, isDryRun = true) {
    let doesDestinationFolderAlreadyExists = false;
    let hasMovingToUploadZonePrinted = false;
    const foldersToShiftLength = foldersToShift.length;
    for (let cnt = 0; cnt < foldersToShiftLength; cnt++) {
        const folderToShift = foldersToShift[cnt];
        // TODO: Removed the folderSizeAfter10Seconds functionality if the above locking system works properly.
        const folderSizeAfter10Seconds = getFolderSizeInBytes(folderToShift[0]);
        if (folderSizeAfter10Seconds !== folderToShift[1]) {
            foldersToShift.splice(folderToShift);
        } else {
            if (!isDryRun && !hasMovingToUploadZonePrinted) {
                process.stdout.write(chalk.cyan('Moving folders to FinishingBuffer and CuttingAccounting: \n'));
                hasMovingToUploadZonePrinted = true;
            }
            if (!isDryRun) {
                const folderNameToPrint = `  ${path.basename(folderToShift[0])} `;
                process.stdout.write(chalk.cyan(folderNameToPrint));
                for (let innerCnt = 0; innerCnt < 58 - folderNameToPrint.length; innerCnt++) {
                    process.stdout.write(chalk.cyan(`.`));
                }
            }
            const newFinishingBufferPath = `${config.contractorsZonePath}\\${
                folderToShift[3]
            }\\${instanceRunDateFormatted}\\${finishingBuffer}\\${path.basename(folderToShift[0])}`;
            const newCuttingAccountingZonePath = `${config.contractorsRecordKeepingPath}\\${
                folderToShift[2]
            }\\${cuttingAccounting}\\${instanceRunDateFormatted}\\${path.basename(folderToShift[0])}`;
            if (isDryRun) {
                if (fs.existsSync(`${newFinishingBufferPath}`)) {
                    lge(`Folder: ${newFinishingBufferPath} already exists, cannot move ${folderToShift[0]} to its location.`);
                    doesDestinationFolderAlreadyExists = true;
                }
                if (fs.existsSync(`${newCuttingAccountingZonePath}`)) {
                    lge(`Folder: ${newCuttingAccountingZonePath} already exists, cannot move ${folderToShift[0]} to its location.`);
                    doesDestinationFolderAlreadyExists = true;
                }
            } else {
                createDirAndCopyFile(folderToShift[0], newCuttingAccountingZonePath);
                await createDirAndMoveFile(folderToShift[0], newFinishingBufferPath);
                folderToShift[0] = newFinishingBufferPath;
            }
            if (!isDryRun) {
                if (cnt !== foldersToShiftLength - 1) {
                    process.stdout.write(chalk.cyan(`, `));
                } else {
                    process.stdout.write(chalk.cyan(`\n`));
                }
            }
        }
    }
    return doesDestinationFolderAlreadyExists;
}

// eslint-disable-next-line no-constant-condition
while (true) {
    createProcessingAndRecordKeepingFolders(instanceRunDateFormatted);

    const foldersToShift = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const cutter of Object.keys(config.contractors)) {
        const cuttersFinisher = config.contractors[cutter].finisher;
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
                    lgw(
                        `Folder in Cutter's CuttingDone locked, maybe a contractor working/moving it, Filename: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Ignoring.`
                    );
                }
            }
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const cutterCuttingDoneSubFolderAndFiles of unlockedFolders) {
            const cutterCuttingDoneSubFolderPath = path.join(cutterCuttingDoneDir, cutterCuttingDoneSubFolderAndFiles);
            const cutterCuttingDoneStat = fs.statSync(cutterCuttingDoneSubFolderPath);
            // Check ReadyToUpload item is a folder
            if (!cutterCuttingDoneStat.isDirectory()) {
                lgw(
                    `Found a file in Cutter's CuttingDone directory, Filename: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Ignoring.`
                );
                // eslint-disable-next-line no-continue
                continue;
            }
            // Check ReadyToUpload folder matches the format
            if (!/^.* (([^\s]* )*)[^\s]+ \d{1,3} \(#\d{5}\)$/.test(cutterCuttingDoneSubFolderAndFiles)) {
                lgw(
                    `Folder in CuttingDone but is not in a proper format, Folder: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Ignoring.`
                );
                // eslint-disable-next-line no-continue
                continue;
            }
            const numberOfImagesAcToFolderName = parseInt(getNumberOfImagesFromAllottedDealerNumberFolder(cutterCuttingDoneSubFolderAndFiles), 10);
            const numberOfImagesAcToFileCount = getFileCountRecursively(cutterCuttingDoneSubFolderPath);
            // Check ReadyToUpload folder filecount matches as mentioned in the folder
            if (numberOfImagesAcToFolderName !== numberOfImagesAcToFileCount) {
                lgw(
                    `Folder in CuttingDone but images quantity does not match, Folder: ${cutter}\\${cuttingDone}\\${cutterCuttingDoneSubFolderAndFiles}, Images Qty ac to folder name: ${numberOfImagesAcToFolderName} and  Images Qty present in the folder: ${numberOfImagesAcToFileCount}, Ignoring.`
                );
                // eslint-disable-next-line no-continue
                continue;
            }
            const folderSize = getFolderSizeInBytes(cutterCuttingDoneSubFolderPath);
            // TODO: Replace by key value pairs
            foldersToShift.push([cutterCuttingDoneSubFolderPath, folderSize, cutter, cuttersFinisher]);
        }
    }

    foldersToShift.sort((a, b) => {
        const regex = /(\d+)/;
        if (!regex.test(path.basename(a[0])) || !regex.test(path.basename(b[0]))) {
            lgc('Unable to match regex of `foldersToShift` while sorting.');
            return 0;
        }
        const numA = Number(path.basename(a[0]).match(regex)[0]);
        const numB = Number(path.basename(b[0]).match(regex)[0]);
        return numA - numB;
    });
    // TODO: This sleep was induced to check folderSizeAfter10Seconds functionality, to be removed if the above locking system works properly.
    // sleep(15);
    // console.log(foldersToShift);

    const doesDestinationFolderAlreadyExists = await moveFilesFromCuttingDoneToFinishingBufferCuttingAccounting(foldersToShift, true);
    if (doesDestinationFolderAlreadyExists) {
        process.exit(1);
    }
    await moveFilesFromCuttingDoneToFinishingBufferCuttingAccounting(foldersToShift, false);
    await waitForSeconds(30);
}
