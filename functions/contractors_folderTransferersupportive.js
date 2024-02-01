import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted } from './datetime.js';
import { config } from '../configs/config.js';
import { lgc, lgd, lgi, lgu, lgw } from './loggerandlocksupportive.js';
import { createDirAndCopyFile, createDirAndMoveFile, getFileCountRecursively, getFolderSizeInBytes, removeDirIfExists } from './filesystem.js';
import { addUploadingToReport } from './reportsupportive.js';
import { printSectionSeperator } from './others.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import { getNumberOfImagesFromAllottedDealerNumberFolder, getUniqueIDWithHashFromAllottedDealerNumberFolder } from './datastoresupportive.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
/* eslint-enable import/extensions */

const finishingBufferFolderName = config.finisherProcessingFolders[0];

const cuttingAccountingFolderName = config.cutterRecordKeepingFolders[0];
const finishingAccountingFolderName = config.finisherRecordKeepingFolders[0];

const historyOfWarnings = [new Set(), new Set(), new Set(), new Set(), new Set()]; // Array of sets for the last five iterations

let currentSetOfWarnings;
function warnNowOrLater(mesg, forceWarnNow, sourceDestinationAccountingType, addToAllHistoryOfWarnings) {
    if (forceWarnNow || sourceDestinationAccountingType === 'uploadingZone') {
        lgw(mesg);
    } else if (sourceDestinationAccountingType === 'finishingBuffer') {
        currentSetOfWarnings.add(mesg);
        if (addToAllHistoryOfWarnings && !historyOfWarnings.some((set) => set.has(mesg))) {
            historyOfWarnings.forEach((set) => set.add(mesg));
        }
    }
}

const sourceDestinationAccountingTypes = {
    finishingBuffer: {
        typeOfContractor: 'Cutter',
        typeOfSourceFolder: 'CuttingDone',
        destinationPath: [config.contractorsZonePath, undefined, instanceRunDateFormatted, finishingBufferFolderName],
        accountingFolder: cuttingAccountingFolderName,
        movingMesg: 'Moving folders to FinishingBuffer and CuttingAccounting',
        sourceFolderName: config.cutterProcessingFolders[0],
        filteredContractorsByType: Object.keys(config.contractors),
    },
    uploadingZone: {
        typeOfContractor: 'Finisher',
        typeOfSourceFolder: 'ReadyToUpload',
        destinationPath: path.join(config.uploadingZonePath, instanceRunDateFormatted),
        accountingFolder: finishingAccountingFolderName,
        movingMesg: 'Moving folders to UploadingZone and FinishingAccounting',
        sourceFolderName: config.finisherProcessingFolders[1],
        filteredContractorsByType: [...new Set(Object.values(config.contractors).map((contractor) => contractor.finisher))],
    },
};

function checkIfFoldersPresentInFinishersUploadingZoneDir() {
    const { filteredContractorsByType, sourceFolderName } = sourceDestinationAccountingTypes.uploadingZone;

    // eslint-disable-next-line no-restricted-syntax
    for (const filteredContractor of filteredContractorsByType) {
        const filteredContractorDestinationDir = path.join(
            config.contractorsZonePath,
            filteredContractor,
            instanceRunDateFormatted,
            sourceFolderName
        );
        /**
         * Check ReadyToUpload folder exists.
         */
        if (!syncOperationWithErrorHandling(fs.existsSync, filteredContractorDestinationDir)) {
            // eslint-disable-next-line no-continue
            continue;
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const filteredContractorDestinationSubFolderAndFiles of syncOperationWithErrorHandling(
            fs.readdirSync,
            filteredContractorDestinationDir
        )) {
            const filteredContractorDestinationSubFolderPath = path.join(
                filteredContractorDestinationDir,
                filteredContractorDestinationSubFolderAndFiles
            );
            const filteredContractorDestinationStat = syncOperationWithErrorHandling(fs.statSync, filteredContractorDestinationSubFolderPath);
            if (filteredContractorDestinationStat.isDirectory()) {
                return true;
            }
        }
    }
    return false;
}

function validationBeforeMoving(sourceDestinationAccountingType, reportJSONObj, debug = false) {
    if (!Object.prototype.hasOwnProperty.call(sourceDestinationAccountingTypes, sourceDestinationAccountingType)) {
        lgu(`Unknown parameter sourceDestinationAccountingType(${sourceDestinationAccountingType}) sent to 'validationBeforeMoving' fn.`);
        process.exit(1);
    }

    sourceDestinationAccountingType === 'finishingBuffer' ? (currentSetOfWarnings = new Set()) : null;
    const { typeOfContractor, typeOfSourceFolder, filteredContractorsByType, sourceFolderName } =
        sourceDestinationAccountingTypes[sourceDestinationAccountingType];
    const foldersToShift = [];

    // eslint-disable-next-line no-restricted-syntax
    for (const filteredContractor of filteredContractorsByType) {
        const filteredContractorDestinationDir = `${config.contractorsZonePath}\\${filteredContractor}\\${instanceRunDateFormatted}\\${sourceFolderName}`;
        // Check CuttingDone/ReadyToUpload folder exists.
        if (!syncOperationWithErrorHandling(fs.existsSync, filteredContractorDestinationDir)) {
            warnNowOrLater(
                `${typeOfContractor}'s ${typeOfSourceFolder} folder doesn't exist: ${filteredContractorDestinationDir}, Ignoring.`,
                true,
                undefined,
                undefined
            );
            // eslint-disable-next-line no-continue
            continue;
        }

        // Get all the folders which are not holding any locks
        const unlockedFolders = [];
        // eslint-disable-next-line no-restricted-syntax
        for (const filteredContractorDestinationSubFolderAndFiles of syncOperationWithErrorHandling(
            fs.readdirSync,
            filteredContractorDestinationDir
        )) {
            const filteredContractorDestinationSubFolderPath = path.join(
                filteredContractorDestinationDir,
                filteredContractorDestinationSubFolderAndFiles
            );
            const filteredContractorDestinationStat = syncOperationWithErrorHandling(fs.statSync, filteredContractorDestinationSubFolderPath);
            if (filteredContractorDestinationStat.isDirectory()) {
                try {
                    syncOperationWithErrorHandling(
                        fs.renameSync,
                        filteredContractorDestinationSubFolderPath,
                        `${filteredContractorDestinationSubFolderPath} `
                    );
                    syncOperationWithErrorHandling(
                        fs.renameSync,
                        `${filteredContractorDestinationSubFolderPath} `,
                        filteredContractorDestinationSubFolderPath.trim()
                    );
                    unlockedFolders.push(filteredContractorDestinationSubFolderAndFiles);
                } catch (err) {
                    const resourceBusyOrLockedOrNotPermittedRegexString = '^(EBUSY: resource busy or locked|EPERM: operation not permitted)';
                    const resourceBusyOrLockedOrNotPermittedRegexExpression = new RegExp(resourceBusyOrLockedOrNotPermittedRegexString);
                    if (resourceBusyOrLockedOrNotPermittedRegexExpression.test(err.message)) {
                        warnNowOrLater(
                            `Folder in ${typeOfContractor}'s ${typeOfSourceFolder} locked, maybe a contractor working/moving it, Filename: ${filteredContractor}\\${sourceFolderName}\\${filteredContractorDestinationSubFolderAndFiles}, Ignoring.`,
                            false,
                            sourceDestinationAccountingType,
                            false
                        );
                    } else {
                        lgc('Unknown error while checking for contractor locked:', err);
                    }
                }
            } else {
                warnNowOrLater(
                    `Found a file in ${typeOfContractor}'s ${typeOfSourceFolder} directory, Filename: ${filteredContractor}\\${sourceFolderName}\\${filteredContractorDestinationSubFolderAndFiles}, Ignoring.`,
                    false,
                    sourceDestinationAccountingType,
                    true
                );
            }
        }

        // eslint-disable-next-line no-restricted-syntax
        for (let filteredContractorDestinationSubFolderAndFiles of unlockedFolders) {
            let isOverwrite = false;
            let filteredContractorDestinationSubFolderPath = path.join(
                filteredContractorDestinationDir,
                filteredContractorDestinationSubFolderAndFiles
            );

            // Check CuttingDone/ReadyToUpload folder has OK_AlreadyMoved_ prefixed to it, if has set overwrite to true and rename the folder to proper format
            const regexallottedFolderAlreadyMovedRegexString = config.allottedFolderRegex.replace('^', '^[O|o][K|k]_AlreadyMoved_');
            const regexallottedFolderAlreadyMovedRegexExpression = new RegExp(regexallottedFolderAlreadyMovedRegexString);
            if (regexallottedFolderAlreadyMovedRegexExpression.test(filteredContractorDestinationSubFolderAndFiles)) {
                const folderWithOkAlreadMovedRemoved = path
                    .basename(filteredContractorDestinationSubFolderPath)
                    .replace(/^[O|o][K|k]_AlreadyMoved_/, '');
                const newFilteredContractorDestinationSubFolderPath = `${path.dirname(
                    filteredContractorDestinationSubFolderPath
                )}/${folderWithOkAlreadMovedRemoved}`;
                syncOperationWithErrorHandling(
                    fs.renameSync,
                    filteredContractorDestinationSubFolderPath,
                    newFilteredContractorDestinationSubFolderPath
                );
                filteredContractorDestinationSubFolderAndFiles = folderWithOkAlreadMovedRemoved;
                filteredContractorDestinationSubFolderPath = path.join(
                    filteredContractorDestinationDir,
                    filteredContractorDestinationSubFolderAndFiles
                );
                isOverwrite = true;
            }

            // Check CuttingDone/ReadyToUpload folder has AlreadyMoved_ prefixed to it, if has ignore the folder
            const alreadyMovedRegexString = config.allottedFolderRegex.replace('^', '^AlreadyMoved_');
            const alreadyMovedRegexExpression = new RegExp(alreadyMovedRegexString);
            if (alreadyMovedRegexExpression.test(filteredContractorDestinationSubFolderAndFiles)) {
                // eslint-disable-next-line no-continue
                continue;
            }

            // Check CuttingDone/ReadyToUpload folder matches the format
            const regexallottedFolderRegexExpression = new RegExp(config.allottedFolderRegex);
            if (!regexallottedFolderRegexExpression.test(filteredContractorDestinationSubFolderAndFiles)) {
                warnNowOrLater(
                    `Folder in ${typeOfSourceFolder} but is not in a proper format, Folder: ${filteredContractor}\\${sourceFolderName}\\${filteredContractorDestinationSubFolderAndFiles}, Ignoring.`,
                    false,
                    sourceDestinationAccountingType,
                    true
                );
                // eslint-disable-next-line no-continue
                continue;
            }
            const numberOfImagesAcToFolderName = parseInt(
                getNumberOfImagesFromAllottedDealerNumberFolder(filteredContractorDestinationSubFolderAndFiles),
                10
            );
            const numberOfImagesAcToFileCount = getFileCountRecursively(filteredContractorDestinationSubFolderPath);
            // Check CuttingDone/ReadyToUpload folder filecount matches as mentioned in the folder
            if (numberOfImagesAcToFolderName !== numberOfImagesAcToFileCount) {
                warnNowOrLater(
                    `Folder in ${typeOfSourceFolder} but images quantity does not match, Folder: ${filteredContractor}\\${sourceFolderName}\\${filteredContractorDestinationSubFolderAndFiles}, Images Qty ac to folder name: ${numberOfImagesAcToFolderName} and  Images Qty present in the folder: ${numberOfImagesAcToFileCount}, Ignoring.`,
                    false,
                    sourceDestinationAccountingType,
                    false
                );
                // eslint-disable-next-line no-continue
                continue;
            }
            let uniqueCode;
            let cutter = null;
            if (sourceDestinationAccountingType === 'uploadingZone') {
                uniqueCode = getUniqueIDWithHashFromAllottedDealerNumberFolder(filteredContractorDestinationSubFolderAndFiles);
                // eslint-disable-next-line no-restricted-syntax
                for (const contractorInSubLoop of Object.keys(config.contractors)) {
                    const contractorDoneSubFolderDir = `${config.contractorsRecordKeepingPath}\\${contractorInSubLoop}_Acnt\\${cuttingAccountingFolderName}\\${instanceRunDateFormatted}\\${filteredContractorDestinationSubFolderAndFiles}`;
                    // const contractorDoneSubFolderDir = `${config.contractorsZonePath}\\${contractorInSubLoop}\\${instanceRunDateFormatted}\\000_Done\\${contractorReadyToUploadSubFolderAndFiles}`;
                    if (syncOperationWithErrorHandling(fs.existsSync, contractorDoneSubFolderDir)) {
                        cutter = contractorInSubLoop;
                        break;
                    }
                }
                if (cutter == null) {
                    warnNowOrLater(
                        `Folder present in 'ReadyToUpload' but not present in 'CuttingAccounting' folder for reporting, Folder: ${filteredContractor}\\${sourceFolderName}\\${filteredContractorDestinationSubFolderAndFiles}, Ignoring.`,
                        true,
                        undefined,
                        undefined
                    );
                    // eslint-disable-next-line no-continue
                    continue;
                }
                if (!reportJSONObj[uniqueCode]) {
                    warnNowOrLater(
                        `Todays report json file '${instanceRunDateFormatted}_report.json' does not contain a key '${uniqueCode}', which should have been created while allotment, Exiting.`,
                        true,
                        undefined,
                        undefined
                    );
                    // eslint-disable-next-line no-continue
                    continue;
                }
                if (path.basename(filteredContractorDestinationSubFolderAndFiles) !== reportJSONObj[uniqueCode].allotmentFolderName) {
                    warnNowOrLater(
                        `The allotment folder name '${
                            reportJSONObj[uniqueCode].allotmentFolderName
                        }' does not match folder name coming back for uploading '${path.basename(
                            filteredContractorDestinationSubFolderPath
                        )}', probably some contractor has modified the folder name, Exiting.`,
                        true,
                        undefined,
                        undefined
                    );
                    // eslint-disable-next-line no-continue
                    continue;
                }
            }
            const folderSize = getFolderSizeInBytes(filteredContractorDestinationSubFolderPath);
            if (sourceDestinationAccountingType === 'uploadingZone') {
                foldersToShift.push({
                    dealerImagesFolder: filteredContractorDestinationSubFolderPath,
                    folderSize: folderSize,
                    uniqueCode: uniqueCode,
                    cutter: cutter,
                    finisher: filteredContractor,
                    isOverwrite: isOverwrite,
                });
            } else if (sourceDestinationAccountingType === 'finishingBuffer') {
                foldersToShift.push({
                    dealerImagesFolder: filteredContractorDestinationSubFolderPath,
                    folderSize: folderSize,
                    cutter: filteredContractor,
                    isOverwrite: isOverwrite,
                });
            }
        }
    }

    foldersToShift.sort((a, b) => {
        const digitsRegexString = `^(\\d+)`;
        const digitsRegexExpression = new RegExp(digitsRegexString);
        if (!digitsRegexExpression.test(path.basename(a.dealerImagesFolder)) || !digitsRegexExpression.test(path.basename(b.dealerImagesFolder))) {
            lgu('Unable to match regex of `foldersToShift` while sorting.');
            return 0;
        }
        const numA = Number(path.basename(a.dealerImagesFolder).match(digitsRegexExpression)[0]);
        const numB = Number(path.basename(b.dealerImagesFolder).match(digitsRegexExpression)[0]);
        return numA - numB;
    });
    debug ? lgd(`foldersToShift :${foldersToShift}`) : null;

    if (sourceDestinationAccountingType === 'finishingBuffer') {
        historyOfWarnings.shift();
        historyOfWarnings.push(currentSetOfWarnings);
        // eslint-disable-next-line no-restricted-syntax
        for (const warning of currentSetOfWarnings) {
            if (historyOfWarnings.every((set) => set.has(warning))) {
                lgw(warning);
                historyOfWarnings.forEach((set) => set.delete(warning));
            }
        }
    }
    return foldersToShift;
}

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
                if (syncOperationWithErrorHandling(fs.existsSync, destinationPath)) {
                    folderExistMesg += `\nDestination: ${destinationPath}`;
                    doesDestinationFolderAlreadyExists = true;
                }
                if (syncOperationWithErrorHandling(fs.existsSync, contractorAccountingPath)) {
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
                    if (syncOperationWithErrorHandling(fs.existsSync, otherAccountingZonePath)) {
                        folderExistMesg += `\nDestination (Other Accounting): ${otherAccountingZonePath}`;
                        doesDestinationFolderAlreadyExists = true;
                    }
                }
                if (doesDestinationFolderAlreadyExists) {
                    lgw(folderExistMesg);
                    syncOperationWithErrorHandling(
                        fs.renameSync,
                        dealerImagesFolder,
                        `${path.dirname(dealerImagesFolder)}/AlreadyMoved_${path.basename(dealerImagesFolder)}`
                    );
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

export { checkIfFoldersPresentInFinishersUploadingZoneDir, moveFilesFromSourceToDestinationAndAccounting, validationBeforeMoving };
