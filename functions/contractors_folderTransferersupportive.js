import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted } from './datetime.js';
import { config } from '../configs/config.js';
import { lge, lgi, lgif, lgw } from './loggersupportive.js';
import { createDirAndCopyFile, createDirAndMoveFile, getFolderSizeInBytes, removeDir } from './filesystem.js';
import { addUploadingToReport } from './reportsupportive.js';
import { printSectionSeperator } from './others.js';
/* eslint-enable import/extensions */

// const cuttingDone = config.cutterProcessingFolders[0];
const finishingBuffer = config.finisherProcessingFolders[0];
// const readyToUpload = config.finisherProcessingFolders[1];

const cuttingAccounting = config.cutterRecordKeepingFolders[0];
const finishingAccounting = config.finisherRecordKeepingFolders[0];

function moveFilesFromCuttingDoneToFinishingBufferCuttingAccounting(foldersToShift, isDryRun = true) {
    let hasMovingToUploadZonePrinted = false;
    const foldersToShiftLength = foldersToShift.length;
    for (let cnt = 0; cnt < foldersToShiftLength; cnt++) {
        const { dealerImagesFolder, folderSize, cutter, cuttersFinisher, isOverwrite } = foldersToShift[cnt];
        // TODO: Removed the folderSizeAfter10Seconds functionality if the above locking system with the message `Folder in Cutter's CuttingDone locked, maybe a contractor working/moving it` works properly.
        const folderSizeAfter10Seconds = getFolderSizeInBytes(dealerImagesFolder);
        if (folderSizeAfter10Seconds !== folderSize) {
            foldersToShift.splice(foldersToShift[cnt]);
        } else {
            if (!isDryRun && !hasMovingToUploadZonePrinted) {
                lgi(`[${chalk.black.bgWhiteBright(currentTimeWOMSFormatted())}] Moving folders to FinishingBuffer and CuttingAccounting: \n`);
                hasMovingToUploadZonePrinted = true;
            }
            if (!isDryRun) {
                const folderNameToPrint = `  ${path.basename(dealerImagesFolder)} `;
                process.stdout.write(chalk.cyan(folderNameToPrint));
                lgif(folderNameToPrint);
                for (let innerCnt = 0; innerCnt < 58 - folderNameToPrint.length; innerCnt++) {
                    process.stdout.write(chalk.cyan(`.`));
                }
            }
            const newFinishingBufferPath = `${
                config.contractorsZonePath
            }\\${cuttersFinisher}\\${instanceRunDateFormatted}\\${finishingBuffer}\\${path.basename(dealerImagesFolder)}`;
            const newCuttingAccountingZonePath = `${
                config.contractorsRecordKeepingPath
            }\\${cutter}_Acnt\\${cuttingAccounting}\\${instanceRunDateFormatted}\\${path.basename(dealerImagesFolder)}`;
            if (isDryRun) {
                if (isOverwrite === false) {
                    let doesDestinationFolderAlreadyExists = false;
                    let folderExistMesg = `Folder cannot be moved to new location as it already exists, Renaming to 'AlreadyMoved_',\nFolder: ${dealerImagesFolder}\n`;
                    if (fs.existsSync(newFinishingBufferPath)) {
                        folderExistMesg += `Destination (Finishing): ${newFinishingBufferPath}\n`;
                        doesDestinationFolderAlreadyExists = true;
                    }
                    if (fs.existsSync(newCuttingAccountingZonePath)) {
                        folderExistMesg += `Destination (Accounting): ${newCuttingAccountingZonePath}\n`;
                        doesDestinationFolderAlreadyExists = true;
                    }
                    const otherContractors = Object.keys(config.contractors).filter((key) => key !== cutter);
                    // eslint-disable-next-line no-restricted-syntax
                    for (const innerLoopCutter of otherContractors) {
                        const otherCuttingAccountingZonePath = `${
                            config.contractorsRecordKeepingPath
                        }\\${innerLoopCutter}_Acnt\\${cuttingAccounting}\\${instanceRunDateFormatted}\\${path.basename(dealerImagesFolder)}`;
                        if (fs.existsSync(otherCuttingAccountingZonePath)) {
                            folderExistMesg += `Destination (Other Cutter Accounting): ${otherCuttingAccountingZonePath}\n`;
                            doesDestinationFolderAlreadyExists = true;
                        }
                    }
                    if (doesDestinationFolderAlreadyExists) {
                        lgw(folderExistMesg);
                        fs.renameSync(dealerImagesFolder, `${path.dirname(dealerImagesFolder)}/AlreadyMoved_${path.basename(dealerImagesFolder)}`);
                        foldersToShift.splice(cnt, 1);
                    }
                }
            } else {
                if (isOverwrite) {
                    if (fs.existsSync(newFinishingBufferPath)) {
                        removeDir(newFinishingBufferPath, true);
                    }
                    if (fs.existsSync(newCuttingAccountingZonePath)) {
                        removeDir(newCuttingAccountingZonePath, true);
                    }
                    const otherContractors = Object.keys(config.contractors).filter((key) => key !== cutter);
                    // eslint-disable-next-line no-restricted-syntax
                    for (const innerLoopCutter of otherContractors) {
                        const otherCuttingAccountingZonePath = `${
                            config.contractorsRecordKeepingPath
                        }\\${innerLoopCutter}_Acnt\\${cuttingAccounting}\\${instanceRunDateFormatted}\\${path.basename(dealerImagesFolder)}`;
                        if (fs.existsSync(otherCuttingAccountingZonePath)) {
                            removeDir(otherCuttingAccountingZonePath, true);
                        }
                    }
                }
                createDirAndCopyFile(dealerImagesFolder, newCuttingAccountingZonePath, isOverwrite);
                createDirAndMoveFile(dealerImagesFolder, newFinishingBufferPath, isOverwrite);
            }
            if (!isDryRun) {
                if (cnt !== foldersToShiftLength - 1) {
                    process.stdout.write(chalk.cyan(`, `));
                } else {
                    process.stdout.write(chalk.cyan(`\n`));
                    printSectionSeperator();
                }
            }
        }
    }
    return foldersToShift;
}

function moveFilesFromContractorsToUploadingZoneAndFinishingAccounting(foldersToShift, isDryRun = true) {
    let hasMovingToUploadZonePrinted = false;
    const foldersToShiftLength = foldersToShift.length;
    for (let cnt = 0; cnt < foldersToShiftLength; cnt++) {
        const { dealerImagesFolder, folderSize, uniqueCode, cuttingDoneBy, finisher, isOverwrite } = foldersToShift[cnt];
        // TODO: Removed the folderSizeAfter10Seconds functionality if the above locking system works properly.
        const folderSizeAfter10Seconds = getFolderSizeInBytes(dealerImagesFolder);
        if (folderSizeAfter10Seconds !== folderSize) {
            foldersToShift.splice(foldersToShift[cnt]);
        } else {
            if (!isDryRun && !hasMovingToUploadZonePrinted) {
                lgi(`[${chalk.black.bgWhiteBright(currentTimeWOMSFormatted())}] Moving folders to UploadingZone and FinishingAccounting: \n`);
                hasMovingToUploadZonePrinted = true;
            }
            if (!isDryRun) {
                const folderNameToPrint = `  ${path.basename(dealerImagesFolder)} `;
                process.stdout.write(chalk.cyan(folderNameToPrint));
                lgif(folderNameToPrint);
                for (let innerCnt = 0; innerCnt < 58 - folderNameToPrint.length; innerCnt++) {
                    process.stdout.write(chalk.cyan(`.`));
                }
            }
            const newUploadingZonePath = `${config.uploadingZonePath}\\${instanceRunDateFormatted}\\${path.basename(dealerImagesFolder)}`;
            const newFinishingAccountingZonePath = `${
                config.contractorsRecordKeepingPath
            }\\${finisher}_Acnt\\${finishingAccounting}\\${instanceRunDateFormatted}\\${path.basename(dealerImagesFolder)}`;
            if (isDryRun) {
                if (isOverwrite === false) {
                    let doesDestinationFolderAlreadyExists = false;
                    let folderExistMesg = `Folder cannot be moved to new location as it already exists, Renaming to 'AlreadyMoved_',\nFolder: ${dealerImagesFolder}\n`;
                    if (fs.existsSync(newUploadingZonePath)) {
                        folderExistMesg += `Destination (UploadingZone): ${newUploadingZonePath}\n`;
                        doesDestinationFolderAlreadyExists = true;
                    }
                    if (fs.existsSync(newFinishingAccountingZonePath)) {
                        folderExistMesg += `Destination (Accounting): ${newFinishingAccountingZonePath}\n`;
                        doesDestinationFolderAlreadyExists = true;
                    }
                    const otherContractors = Object.keys(config.contractors).filter((key) => key !== finisher);
                    // eslint-disable-next-line no-restricted-syntax
                    for (const innerLoopCutter of otherContractors) {
                        const otherFinishingAccountingZonePath = `${
                            config.contractorsRecordKeepingPath
                        }\\${innerLoopCutter}_Acnt\\${finishingAccounting}\\${instanceRunDateFormatted}\\${path.basename(dealerImagesFolder)}`;
                        if (fs.existsSync(otherFinishingAccountingZonePath)) {
                            folderExistMesg += `Destination (Other Cutter Accounting): ${otherFinishingAccountingZonePath}\n`;
                            doesDestinationFolderAlreadyExists = true;
                        }
                    }
                    if (doesDestinationFolderAlreadyExists) {
                        lgw(folderExistMesg);
                        fs.renameSync(dealerImagesFolder, `${path.dirname(dealerImagesFolder)}/AlreadyMoved_${path.basename(dealerImagesFolder)}`);
                        foldersToShift.splice(cnt, 1);
                    }
                }
            } else {
                if (isOverwrite) {
                    if (fs.existsSync(newUploadingZonePath)) {
                        removeDir(newUploadingZonePath, true);
                    }
                    if (fs.existsSync(newFinishingAccountingZonePath)) {
                        removeDir(newFinishingAccountingZonePath, true);
                    }
                    const otherContractors = Object.keys(config.contractors).filter((key) => key !== finisher);
                    // eslint-disable-next-line no-restricted-syntax
                    for (const innerLoopFinisher of otherContractors) {
                        const otherFinishingAccountingZonePath = `${
                            config.contractorsRecordKeepingPath
                        }\\${innerLoopFinisher}_Acnt\\${finishingAccounting}\\${instanceRunDateFormatted}\\${path.basename(dealerImagesFolder)}`;
                        if (fs.existsSync(otherFinishingAccountingZonePath)) {
                            removeDir(otherFinishingAccountingZonePath, true);
                        }
                    }
                }
                addUploadingToReport([path.basename(dealerImagesFolder), uniqueCode, cuttingDoneBy, finisher]);
                createDirAndCopyFile(dealerImagesFolder, newFinishingAccountingZonePath, isOverwrite);
                createDirAndMoveFile(dealerImagesFolder, newUploadingZonePath, isOverwrite);
            }
            if (!isDryRun) {
                if (cnt !== foldersToShiftLength - 1) {
                    process.stdout.write(chalk.cyan(`, `));
                } else {
                    process.stdout.write(chalk.cyan(`\n`));
                    printSectionSeperator();
                }
            }
        }
    }
    return foldersToShift;
}

export { moveFilesFromCuttingDoneToFinishingBufferCuttingAccounting, moveFilesFromContractorsToUploadingZoneAndFinishingAccounting };
