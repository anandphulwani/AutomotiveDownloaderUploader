import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted, instanceRunDateWODayFormatted } from './datetime.js';
import { config } from '../configs/config.js';
import { lge, lgi, lgif, lgw } from './loggerandlocksupportive.js';
import { createDirAndCopyFile, createDirAndMoveFile, getFolderSizeInBytes, removeDirIfExists } from './filesystem.js';
import { addUploadingToReport } from './reportsupportive.js';
import { printSectionSeperator } from './others.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
/* eslint-enable import/extensions */

const cuttingDoneFolderName = config.cutterProcessingFolders[0];
const finishingBufferFolderName = config.finisherProcessingFolders[0];
const readyToUploadFolderName = config.finisherProcessingFolders[1];

const cuttingAccountingFolderName = config.cutterRecordKeepingFolders[0];
const finishingAccountingFolderName = config.finisherRecordKeepingFolders[0];

const sourceDestinationAccountingTypes = {
    finishingBuffer: {
        destinationPath: [config.contractorsZonePath, undefined, instanceRunDateFormatted, finishingBufferFolderName],
        accountingFolder: cuttingAccountingFolderName,
        movingMesg: 'Moving folders to FinishingBuffer and CuttingAccounting',
    },
    uploadingZone: {
        destinationPath: path.join(config.uploadingZonePath, instanceRunDateFormatted),
        accountingFolder: finishingAccountingFolderName,
        movingMesg: 'Moving folders to UploadingZone and FinishingAccounting',
    },
};

function moveFilesFromSourceToDestinationAndAccounting(sourceDestinationAccountingType, foldersToShift, isDryRun = true) {
    // eslint-disable-next-line prefer-const
    let { accountingFolder, movingMesg } = sourceDestinationAccountingTypes[sourceDestinationAccountingType];
    let hasMovingToUploadZonePrinted = false;
    const foldersToShiftLength = foldersToShift.length;
    for (let cnt = 0; cnt < foldersToShiftLength; cnt++) {
        let { destinationPath } = sourceDestinationAccountingTypes[sourceDestinationAccountingType];
        const { dealerImagesFolder, isOverwrite } = foldersToShift[cnt];
        let contractor;
        let contractorAccountingPath;
        if (sourceDestinationAccountingType === 'finishingBuffer') {
            contractor = foldersToShift[cnt].cutter;
            const cuttersFinisher = config.contractors[contractor].finisher;
            destinationPath[1] = cuttersFinisher;
            destinationPath = path.join(...destinationPath);
        } else if (sourceDestinationAccountingType === 'uploadingZone') {
            contractor = foldersToShift[cnt].finisher;
        }
        destinationPath = path.join(destinationPath, path.basename(dealerImagesFolder));
        contractorAccountingPath = path.join(config.contractorsRecordKeepingPath, `${contractor}_Acnt`, accountingFolder, instanceRunDateFormatted);
        contractorAccountingPath = path.join(contractorAccountingPath, path.basename(dealerImagesFolder));

        if (!isDryRun && !hasMovingToUploadZonePrinted) {
            lgi(`[`, LineSeparator.false);
            lgi(currentTimeWOMSFormatted(), Color.bgWhite, LoggingPrefix.false, LineSeparator.false);
            lgi(`]`, LoggingPrefix.false, LineSeparator.false);
            lgi(` ${movingMesg}: `, LoggingPrefix.false);
            hasMovingToUploadZonePrinted = true;
        }
        if (!isDryRun) {
            const folderNameToPrint = `  ${path.basename(dealerImagesFolder)} `;
            lgi(folderNameToPrint, cnt % 2 === 0 ? LoggingPrefix.true : LoggingPrefix.false, LineSeparator.false);
            for (let innerCnt = 0; innerCnt < 58 - folderNameToPrint.length; innerCnt++) {
                lgi(`.`, LoggingPrefix.false, LineSeparator.false);
            }
        }
        if (isDryRun) {
            if (isOverwrite === false) {
                let doesDestinationFolderAlreadyExists = false;
                let folderExistMesg = `Folder cannot be moved to new location as it already exists, Renaming to 'AlreadyMoved_',\nFolder: ${dealerImagesFolder}`;
                if (fs.existsSync(destinationPath)) {
                    folderExistMesg += `\nDestination: ${destinationPath}`;
                    doesDestinationFolderAlreadyExists = true;
                }
                if (fs.existsSync(contractorAccountingPath)) {
                    folderExistMesg += `\nDestination (Accounting): ${contractorAccountingPath}`;
                    doesDestinationFolderAlreadyExists = true;
                }
                const otherContractors = Object.keys(config.contractors).filter((key) => key !== contractor);
                // eslint-disable-next-line no-restricted-syntax
                for (const innerLoopContractor of otherContractors) {
                    const otherAccountingZonePath = path.join(
                        config.contractorsRecordKeepingPath,
                        `${innerLoopContractor}_Acnt`,
                        accountingFolder,
                        instanceRunDateFormatted,
                        path.basename(dealerImagesFolder)
                    );
                    if (fs.existsSync(otherAccountingZonePath)) {
                        folderExistMesg += `\nDestination (Other Accounting): ${otherAccountingZonePath}`;
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
                removeDirIfExists(destinationPath, true);
                removeDirIfExists(contractorAccountingPath, true);
                const otherContractors = Object.keys(config.contractors).filter((key) => key !== contractor);
                // eslint-disable-next-line no-restricted-syntax
                for (const innerLoopContractor of otherContractors) {
                    const otherAccountingZonePath = path.join(
                        config.contractorsRecordKeepingPath,
                        `${innerLoopContractor}_Acnt`,
                        accountingFolder,
                        instanceRunDateFormatted,
                        path.basename(dealerImagesFolder)
                    );
                    removeDirIfExists(otherAccountingZonePath, true);
                }
            }
            if (sourceDestinationAccountingType === 'uploadingZone') {
                const { uniqueCode, cutter } = foldersToShift[cnt];
                addUploadingToReport([path.basename(dealerImagesFolder), uniqueCode, cutter, contractor]);
            }
            createDirAndCopyFile(dealerImagesFolder, contractorAccountingPath, isOverwrite);
            createDirAndMoveFile(dealerImagesFolder, destinationPath, isOverwrite);
        }
        if (!isDryRun) {
            if (cnt !== foldersToShiftLength - 1) {
                lgi(`, `, LoggingPrefix.false, LineSeparator.false);
            } else {
                lgi('', LoggingPrefix.false);
                printSectionSeperator();
            }
        }
    }
    return foldersToShift;
}

const cuttersCompletedAndDoneFileCreated = [];
function checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer() {
    // Check if JSON file of report exists, because that means some download is done and the first lot is allotted.
    const reportDateFolder = path.join(config.reportsPath, 'jsondata', instanceRunDateWODayFormatted);
    const reportJSONFilePath = path.join(reportDateFolder, `${instanceRunDateFormatted}_report.json`);
    if (!fs.existsSync(reportJSONFilePath)) {
        return;
    }

    /**
     * Ignore if downloadPath/TodaysDate contains some data.
     */
    const downloadPathWithTodaysDate = `${config.downloadPath}\\${instanceRunDateFormatted}`;
    if (fs.existsSync(downloadPathWithTodaysDate) && fs.readdirSync(downloadPathWithTodaysDate).length !== 0) {
        return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const contractor of Object.keys(config.contractors)) {
        const allWorkDoneFile = `${contractor}_${instanceRunDateFormatted}.txt`;
        /**
         * Ignore `contractor` if it the file is created, i.e. its filename is already present `cuttersCompletedAndDoneFileCreated`.
         */
        if (cuttersCompletedAndDoneFileCreated.includes(allWorkDoneFile)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore `contractor` if its contractorsZonePath is not present.
         */
        const contractorPath = path.join(config.contractorsZonePath, contractor, instanceRunDateFormatted);
        if (!fs.existsSync(contractorPath)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore if contractorZonePath contains files allotted are already present, i.e. folders except
         * cuttingDoneFolderName, finishingBufferFolderName, readyToUploadFolderName
         */
        let contractorPathFiles = fs.readdirSync(contractorPath);
        contractorPathFiles = contractorPathFiles.filter(
            (filename) => ![cuttingDoneFolderName, finishingBufferFolderName, readyToUploadFolderName].includes(filename)
        );
        if (contractorPathFiles.length !== 0) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore `contractor` if its contractors cuttingDone folder is not present.
         */
        const contractorPathCuttingDone = path.join(config.contractorsZonePath, contractor, instanceRunDateFormatted, cuttingDoneFolderName);
        if (!fs.existsSync(contractorPath)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore `contractor` if its contractors cuttingDone folder has files present in the cuttingDone folder.
         */
        const contractorPathCuttingDoneFiles = fs.readdirSync(contractorPathCuttingDone);
        if (contractorPathCuttingDoneFiles.length !== 0) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const cuttersFinisher = config.contractors[contractor].finisher;
        const cuttersFinishersFinishingBufferPath = path.join(
            config.contractorsZonePath,
            cuttersFinisher,
            instanceRunDateFormatted,
            finishingBufferFolderName
        );
        const allWorkDoneFileFullPath = path.join(cuttersFinishersFinishingBufferPath, allWorkDoneFile);
        if (!fs.existsSync(allWorkDoneFileFullPath)) {
            fs.closeSync(fs.openSync(allWorkDoneFileFullPath, 'a'));
            cuttersCompletedAndDoneFileCreated.push(allWorkDoneFile);
        }
    }
}

export { moveFilesFromSourceToDestinationAndAccounting, checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer };
