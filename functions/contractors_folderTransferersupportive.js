import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted, instanceRunDateWODayFormatted } from './datetime.js';
import { config } from '../configs/config.js';
import { lge, lgi, lgif, lgw } from './loggersupportive.js';
import { createDirAndCopyFile, createDirAndMoveFile, getFolderSizeInBytes, removeDirIfExists } from './filesystem.js';
import { addUploadingToReport } from './reportsupportive.js';
import { printSectionSeperator } from './others.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
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
    let { destinationPath, accountingFolder, movingMesg } = sourceDestinationAccountingTypes[sourceDestinationAccountingType];
    let hasMovingToUploadZonePrinted = false;
    const foldersToShiftLength = foldersToShift.length;
    for (let cnt = 0; cnt < foldersToShiftLength; cnt++) {
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
            lgi(currentTimeWOMSFormatted(), Color.bgWhite, LineSeparator.false);
            lgi(`]`, LineSeparator.false);
            lgi(`${movingMesg}: `);
            hasMovingToUploadZonePrinted = true;
        }
        if (!isDryRun) {
            const folderNameToPrint = `  ${path.basename(dealerImagesFolder)} `;
            lgi(folderNameToPrint, LineSeparator.false);
            for (let innerCnt = 0; innerCnt < 58 - folderNameToPrint.length; innerCnt++) {
                lgi(`.`, LineSeparator.false);
            }
        }
        if (isDryRun) {
            if (isOverwrite === false) {
                let doesDestinationFolderAlreadyExists = false;
                let folderExistMesg = `Folder cannot be moved to new location as it already exists, Renaming to 'AlreadyMoved_',\nFolder: ${dealerImagesFolder}\n`;
                if (fs.existsSync(destinationPath)) {
                    folderExistMesg += `Destination: ${destinationPath}\n`;
                    doesDestinationFolderAlreadyExists = true;
                }
                if (fs.existsSync(contractorAccountingPath)) {
                    folderExistMesg += `Destination (Accounting): ${contractorAccountingPath}\n`;
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
                        folderExistMesg += `Destination (Other Accounting): ${otherAccountingZonePath}\n`;
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
                lgi(`, `, LineSeparator.false);
            } else {
                lgi('');
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

    const downloadPathWithTodaysDate = `${config.downloadPath}\\${instanceRunDateFormatted}`;
    if (fs.existsSync(downloadPathWithTodaysDate) && fs.readdirSync(downloadPathWithTodaysDate).length !== 0) {
        return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const contractor of Object.keys(config.contractors)) {
        const allWorkDoneFile = `${contractor}_${instanceRunDateFormatted}.txt`;
        if (cuttersCompletedAndDoneFileCreated.includes(allWorkDoneFile)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const contractorPath = path.join(config.contractorsZonePath, contractor, instanceRunDateFormatted);
        if (!fs.existsSync(contractorPath)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        let contractorPathFiles = fs.readdirSync(contractorPath);
        contractorPathFiles = contractorPathFiles.filter(
            (filename) => ![cuttingDoneFolderName, finishingBufferFolderName, readyToUploadFolderName].includes(filename)
        );
        if (contractorPathFiles.length !== 0) {
            // eslint-disable-next-line no-continue
            continue;
        }

        const contractorPathCuttingDone = path.join(config.contractorsZonePath, contractor, instanceRunDateFormatted, cuttingDoneFolderName);
        if (!fs.existsSync(contractorPath)) {
            // eslint-disable-next-line no-continue
            continue;
        }
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
