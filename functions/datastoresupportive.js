import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted, currentTime } from './datetime.js';
import { config } from '../configs/config.js';
import { lgc, lgi, lgu, lgd } from './loggerandlocksupportive.js';
import { createDirAndCopyFile, makeDir, removeDir } from './filesystem.js';
import { instanceRunLogFilePrefix } from './loggervariables.js';
import { getProjectLogsDirPath } from './projectpaths.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import { getUnderProcessingAcToReport } from './reportsupportive.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
/* eslint-enable import/extensions */

/**
 *  Just to make sure this file is called and a lock is obtained on self files, before doing any clean up.
 */
instanceRunLogFilePrefix;
const perImageTimeToUpload = 7.25;
const perVINTimeToUpload = 7;

function autoCleanUpDatastoreZones(noOfDaysDataToKeep = 5, debug = false) {
    lgi(`Auto cleaning up the datastore: `, LineSeparator.false);
    const foldersToCleanUp = [
        config.lockingBackupsZonePath,
        config.downloadPath,
        config.doneAllotmentZonePath,
        config.uploadingZonePath,
        config.doneUploadingZonePath,
        `${config.doneUploadingZonePath}\\DeletedUrls`,
        getProjectLogsDirPath(), // Static delete after 120 days
    ];

    const cuttingAccounting = config.cutterRecordKeepingFolders[0];
    const finishingAccounting = config.finisherRecordKeepingFolders[0];

    // eslint-disable-next-line no-restricted-syntax, no-unreachable-loop
    for (const contractor of Object.keys(config.contractors)) {
        foldersToCleanUp.push(`${config.contractorsRecordKeepingPath}\\${contractor}_Acnt\\${cuttingAccounting}`);
    }

    const finishers = [...new Set(Object.values(config.contractors).map((contractor) => contractor.finisher))];
    // eslint-disable-next-line no-restricted-syntax, no-unreachable-loop
    for (const finisher of Object.keys(finishers)) {
        foldersToCleanUp.push(`${config.contractorsRecordKeepingPath}\\${finisher}_Acnt\\${finishingAccounting}`);
    }

    /* #region: Cleanup all the folders > subFolders here, to keep last 5 days / no of days data to keep, keep last date folders accordingly. */
    // eslint-disable-next-line no-restricted-syntax
    for (const folderToCleanUp of foldersToCleanUp) {
        if (!syncOperationWithErrorHandling(fs.existsSync, folderToCleanUp)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const dateRegexString = `^\\d{4}-\\d{2}-\\d{2}$`;
        const dateRegexExpression = new RegExp(dateRegexString);
        const folderPathChildren = syncOperationWithErrorHandling(fs.readdirSync, folderToCleanUp);
        const folderPathChildrenSubDirsOnly = folderPathChildren.filter(
            (file) => syncOperationWithErrorHandling(fs.lstatSync, path.join(folderToCleanUp, file)).isDirectory() && dateRegexExpression.test(file)
        ); // Filter out only subdirectories and subdirectories which match YYYY-MM-DD format using regex
        folderPathChildrenSubDirsOnly.sort(); // Sort subdirectories by name
        let overrideNoOfDaysToKeep = noOfDaysDataToKeep;
        overrideNoOfDaysToKeep = folderToCleanUp === getProjectLogsDirPath() ? 120 : overrideNoOfDaysToKeep;
        overrideNoOfDaysToKeep = folderToCleanUp === config.lockingBackupsZonePath ? 2 : overrideNoOfDaysToKeep;
        const folderPathChildrenSubDirsToDelete = folderPathChildrenSubDirsOnly.slice(0, -overrideNoOfDaysToKeep); // Delete all but the last 5 subdirectories

        // eslint-disable-next-line no-restricted-syntax
        for (const folderPathChildrenSubDirToDelete of folderPathChildrenSubDirsToDelete) {
            const directoryPath = path.join(folderToCleanUp, folderPathChildrenSubDirToDelete);
            removeDir(directoryPath, true);
        }
    }
    /* #endregion: Cleanup all the folders > subFolders here, to keep last 5 days / no of days data to keep, keep last date folders accordingly. */
    lgi(`01:${logSymbols.success} `, LoggingPrefix.false, LineSeparator.false);

    /* #region: Cleanup config.lockingBackupsZonePath/dateFolder files which have size 0 . */
    if (syncOperationWithErrorHandling(fs.existsSync, config.lockingBackupsZonePath)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const dateDir of syncOperationWithErrorHandling(fs.readdirSync, config.lockingBackupsZonePath)) {
            const datePath = path.join(config.lockingBackupsZonePath, dateDir);
            if (syncOperationWithErrorHandling(fs.statSync, datePath).isDirectory()) {
                const dateDirFilesAndFolders = syncOperationWithErrorHandling(fs.readdirSync, datePath);
                // Filter only the files that are not in lockDirectories
                const zeroSizeFiles = dateDirFilesAndFolders.filter((file) => {
                    const filePath = path.join(datePath, file);
                    const statSync = syncOperationWithErrorHandling(fs.statSync, filePath);
                    const isDirectory = statSync.isDirectory();
                    const isSizeZero = statSync.size === 0;
                    return !isDirectory && isSizeZero;
                });

                // eslint-disable-next-line no-restricted-syntax
                for (const file of zeroSizeFiles) {
                    const filePath = path.join(datePath, file);
                    syncOperationWithErrorHandling(fs.unlinkSync, filePath);
                }
            }
        }
    }
    /* #endregion: Cleanup config.lockingBackupsZonePath/dateFolder files which have size 0 . */
    lgi(`02:${logSymbols.success} `, LoggingPrefix.false, LineSeparator.false);

    /* #region: In config.lockingBackupsZonePath/todaysDate folder, keep last 30 files of each types, and in remaining files just keep a single file of filename_HHmm pattern. */
    const lockingBackupsDirWithTodaysDate = `${config.lockingBackupsZonePath}\\${instanceRunDateFormatted}`;
    if (syncOperationWithErrorHandling(fs.existsSync, lockingBackupsDirWithTodaysDate)) {
        const lockingBackupsFiles = syncOperationWithErrorHandling(fs.readdirSync, lockingBackupsDirWithTodaysDate);
        const ignoreFilesStartWith = ['Bookmarks'];

        // Step 1: Group files by their prefix
        const groups = {};
        lockingBackupsFiles.forEach((fileName) => {
            const prefix = fileName.split('_')[0];
            if (!groups[prefix]) {
                groups[prefix] = [];
            }
            groups[prefix].push(fileName);
        });

        // Step 2: Sort files in each group by timestamp in descending order
        Object.keys(groups).forEach((prefix) => {
            groups[prefix].sort((a, b) => {
                const timestampA = parseInt(a.substring(a.lastIndexOf('_') + 1), 10);
                const timestampB = parseInt(b.substring(b.lastIndexOf('_') + 1), 10);
                return timestampB - timestampA;
            });
        });

        // Step 3: Remove the latest 30 files in each group, so that they are not deleted
        Object.keys(groups).forEach((prefix) => {
            groups[prefix] = groups[prefix].slice(30);
        });
        ignoreFilesStartWith.forEach((key) => {
            if (Object.prototype.hasOwnProperty.call(groups, key)) {
                delete groups[key];
            }
        });
        debug ? lgd(`After removing the latest 30 files in each group, groups: ${groups}`) : null;

        // Step 4: Identify unique "filename_HHmm" patterns from remaining files
        const remainingFiles = Object.values(groups).flat();
        debug ? lgd(`remainingFiles: ${remainingFiles}`) : null;

        const uniquePatterns = Array.from(new Set(remainingFiles.map((fileName) => fileName.substr(0, fileName.length - 10))));
        debug ? lgd(`uniquePatterns: ${uniquePatterns}`) : null;

        // Step 5: Sort remaining files by timestamp in descending order
        remainingFiles.sort((a, b) => {
            const timestampA = parseInt(a.substring(a.lastIndexOf('_') + 1), 10);
            const timestampB = parseInt(b.substring(b.lastIndexOf('_') + 1), 10);
            return timestampB - timestampA;
        });
        debug ? lgd(`Sorted remaining files by timestamp in descending order, remainingFiles: ${remainingFiles}`) : null;

        // Step 6: Keep only the first file for each unique "filename_HHmm" pattern
        const finalFiles = [];
        uniquePatterns.forEach((pattern) => {
            const matchingFiles = remainingFiles.filter((fileName) => fileName.startsWith(pattern));
            if (matchingFiles.length > 0) {
                matchingFiles.shift();
                finalFiles.push(...matchingFiles);
            }
        });

        finalFiles.forEach((filePath) => {
            try {
                syncOperationWithErrorHandling(fs.unlinkSync, path.join(lockingBackupsDirWithTodaysDate, filePath));
            } catch (error) {
                lgc(`Failed to delete file: ${filePath}`, error);
            }
        });
    }
    /* #endregion: In config.lockingBackupsZonePath/todaysDate folder, keep last 30 files of each types, and in remaining files just keep a single file of filename_HHmm pattern. */
    lgi(`03:${logSymbols.success} `, LoggingPrefix.false, LineSeparator.false);

    // eslint-disable-next-line no-restricted-syntax
    for (const dateDir of syncOperationWithErrorHandling(fs.readdirSync, getProjectLogsDirPath())) {
        const entryPath = path.join(getProjectLogsDirPath(), dateDir);
        if (syncOperationWithErrorHandling(fs.statSync, entryPath).isDirectory()) {
            const dateDirFilesAndFolders = syncOperationWithErrorHandling(fs.readdirSync, entryPath, { withFileTypes: true });
            let lockDirectories = dateDirFilesAndFolders
                .filter((dirent) => dirent.isDirectory() && dirent.name.endsWith('.lock'))
                .map((dirent) => path.join(entryPath, dirent.name));
            lockDirectories = lockDirectories.map((dir) => dir.replace(/\.lock$/, ''));

            // Filter only the files that are not in lockDirectories
            const nonLockFiles = dateDirFilesAndFolders.filter((dirent) => {
                const filePath = path.join(entryPath, dirent.name);
                const isDirectory = dirent.isDirectory();
                const isNotLocked = !lockDirectories.some((lockDir) => dirent.name.startsWith(lockDir));
                let isSizeZero;
                try {
                    isSizeZero = syncOperationWithErrorHandling(fs.statSync, filePath).size === 0;
                } catch (error) {
                    const resourceBusyOrLockedOrNotPermittedRegexString = '^(EBUSY: resource busy or locked|EPERM: operation not permitted)';
                    const resourceBusyOrLockedOrNotPermittedRegexExpression = new RegExp(resourceBusyOrLockedOrNotPermittedRegexString);
                    if (resourceBusyOrLockedOrNotPermittedRegexExpression.test(error.message.trim())) {
                        isSizeZero = false;
                    } else {
                        throw error;
                    }
                }
                return !isDirectory && isNotLocked && isSizeZero;
            });

            // eslint-disable-next-line no-restricted-syntax
            for (const file of nonLockFiles) {
                const filePath = path.join(entryPath, file.name);
                syncOperationWithErrorHandling(fs.unlinkSync, filePath);
            }
        }
    }
    lgi(`04:${logSymbols.success}`, LoggingPrefix.false);
}

function getNumberOfImagesFromAllottedDealerNumberFolder(folderName) {
    const regexString = config.allottedFolderRegex;
    const regexExpression = new RegExp(regexString);

    if (!regexExpression.test(folderName)) {
        lgu('Unable to match regex for fn getNumberOfImagesFromAllottedDealerNumberFolder()');
        process.exit(1);
    }

    return folderName.match(regexExpression)[4];
}

function getUniqueIDWithHashFromAllottedDealerNumberFolder(folderName) {
    const regexString = config.allottedFolderRegex;
    const regexExpression = new RegExp(regexString);

    if (!regexExpression.test(folderName)) {
        lgu('Unable to match regex for fn getUniqueIDWithHashFromAllottedDealerNumberFolder()');
        process.exit(1);
    }

    return folderName.match(regexExpression)[5];
}

function getUniqueIDFromAllottedDealerNumberFolder(folderName) {
    const regexString = config.allottedFolderRegex;
    const regexExpression = new RegExp(regexString);

    if (!regexExpression.test(folderName)) {
        lgu('Unable to match regex for fn getUniqueIDFromAllottedDealerNumberFolder()');
        process.exit(1);
    }

    return folderName.match(regexExpression)[6];
}

function getUploadRemainingSummary(foldersToUpload) {
    const underProcessingAcToReport = getUnderProcessingAcToReport();

    const dealerFoldersQty = Object.keys(foldersToUpload).filter(
        (key) => foldersToUpload[key].imagesQty !== 0 && foldersToUpload[key].dealerFolderFilesQty !== 0
    ).length;
    const totalImagesQty = Object.values(foldersToUpload).reduce((acc, folder) => acc + folder.imagesQty, 0);
    const totalVINFolderFilesQty = Object.values(foldersToUpload).reduce((acc, folder) => acc + folder.dealerFolderFilesQty, 0);
    const totalTimeInSeconds = Math.round(totalImagesQty * perImageTimeToUpload + totalVINFolderFilesQty * perVINTimeToUpload);
    const durationHours = Math.floor(totalTimeInSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const durationMinutes = Math.floor((totalTimeInSeconds - durationHours * 3600) / 60)
        .toString()
        .padStart(2, '0');
    const durationSeconds = (totalTimeInSeconds % 60).toString().padStart(2, '0');

    const dateTimeObj = new Date(); // Get current time
    dateTimeObj.setHours(dateTimeObj.getHours() + parseInt(durationHours, 10));
    dateTimeObj.setMinutes(dateTimeObj.getMinutes() + parseInt(durationMinutes, 10));
    dateTimeObj.setSeconds(dateTimeObj.getSeconds() + parseInt(durationSeconds, 10));

    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }; // Format the time in hh:mm:ss tt format
    const finishedTime = dateTimeObj.toLocaleString('en-US', options);

    const returnMesg = [];
    if (underProcessingAcToReport.underProcessingDealerFolders !== undefined && underProcessingAcToReport.underProcessingImgQty !== undefined) {
        returnMesg.push(
            `Remaining Processing DealerFolders: ${underProcessingAcToReport.underProcessingDealerFolders}, Images: ${underProcessingAcToReport.underProcessingImgQty},`
        );
    }
    returnMesg.push(
        `Uploading DealerFolders: ${dealerFoldersQty}, Images: ${totalImagesQty}, VINFolder/VINFiles: ${totalVINFolderFilesQty}, Time: ${durationHours}:${durationMinutes}:${durationSeconds}, Will finish it at ${finishedTime}.`
    );
    return returnMesg;
}

function createBackupOfFile(fileToOperateOn, dataToBeWritten, debug = false) {
    const randomNumer = Math.floor(Math.random() * (999 - 100 + 1) + 100);

    const fromPath = fileToOperateOn;
    const toPath = `${config.lockingBackupsZonePath}\\${instanceRunDateFormatted}\\${path.basename(
        fileToOperateOn
    )}_${currentTime()}(${randomNumer})`;
    const toPathToWrite = `${config.lockingBackupsZonePath}\\${instanceRunDateFormatted}\\Backup\\${path.basename(
        fileToOperateOn
    )}_${currentTime()}(${randomNumer})`;
    createDirAndCopyFile(fromPath, toPath);
    if (path.basename(fileToOperateOn) === 'Bookmarks') {
        makeDir(path.dirname(toPathToWrite));
        syncOperationWithErrorHandling(fs.writeFileSync, toPathToWrite, dataToBeWritten);
    }
}

// eslint-disable-next-line import/prefer-default-export
export {
    perImageTimeToUpload,
    perVINTimeToUpload,
    autoCleanUpDatastoreZones,
    getNumberOfImagesFromAllottedDealerNumberFolder,
    getUniqueIDWithHashFromAllottedDealerNumberFolder,
    getUniqueIDFromAllottedDealerNumberFolder,
    getUploadRemainingSummary,
    createBackupOfFile,
};
