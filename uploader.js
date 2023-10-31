import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted, instanceRunDateWODayFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { lgw, lge, lgc, lgi } from './functions/loggersupportive.js';
import { waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import { getAllUsernamesBookmarks } from './functions/bookmarksupportive.js';
import { gotoURL } from './functions/goto.js';
import { checkTimezone, checkTimeWithNTP } from './functions/time.js';
import { getUniqueIdPairsFromDealerBookmarkName } from './functions/bookmark.js';
import { getCredentialsForUsername } from './functions/configsupportive.js';
import { setCurrentDealerConfiguration } from './functions/excelsupportive.js';
import { validateDealerConfigurationExcelFile } from './functions/excelvalidation.js';
import { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText } from './functions/bookmarkvalidation.js';
import { addUploadingToReport } from './functions/reportsupportive.js';
import { validateConfigFile } from './functions/configvalidation.js';
import {
    createDirAndMoveFile,
    getFileCountNonRecursively,
    getFileCountRecursively,
    getFolderSizeInBytes,
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty,
    createDirAndCopyFile,
} from './functions/filesystem.js';
import {
    autoCleanUpDatastoreZones,
    getUploadRemainingSummary,
    getNumberOfImagesFromAllottedDealerNumberFolder,
    getUniqueIDFromAllottedDealerNumberFolder,
} from './functions/datastoresupportive.js';
import { initBrowserAndGetPage, loginCredentials, getCurrentUser } from './functions/browsersupportive.js';
import { uploadBookmarkURL } from './functions/upload.js';
import { attainLock, releaseLock } from './functions/locksupportive.js';
import { moveFilesFromContractorsToUploadingZoneAndFinishingAccounting } from './functions/contractors_folderTransferersupportive.js';
/* eslint-enable import/extensions */

if (config.environment === 'production') {
    checkTimezone();
    printSectionSeperator();

    await checkTimeWithNTP();
    printSectionSeperator();
}
autoCleanUpDatastoreZones();
printSectionSeperator();

// TODO: validate config file here

// const cuttingDone = config.cutterProcessingFolders[0];
// const finishingBuffer = config.finisherProcessingFolders[0];
const readyToUpload = config.finisherProcessingFolders[1];

const cuttingAccounting = config.cutterRecordKeepingFolders[0];
const finishingAccounting = config.finisherRecordKeepingFolders[0];

const reportJSONFilePath = path.join(config.reportsPath, 'jsondata', instanceRunDateWODayFormatted, `${instanceRunDateFormatted}_report.json`);
let reportJSONObj;
try {
    if (!fs.existsSync(reportJSONFilePath)) {
        lge(`Todays report json file '${instanceRunDateFormatted}_report.json' was not created while allotment, Exiting.`);
        process.exit(1);
    }
    // createBackupOfFile(fileToOperateOn, newConfigUserContent);
    attainLock(reportJSONFilePath, undefined, true);
    const reportJSONContents = fs.readFileSync(reportJSONFilePath, 'utf8');
    reportJSONObj = JSON.parse(reportJSONContents);
    releaseLock(reportJSONFilePath, undefined, true);
} catch (err) {
    lgc(err);
    releaseLock(reportJSONFilePath, undefined, true);
    process.exit(1);
}

let foldersToShift = [];
const finishers = [...new Set(Object.values(config.contractors).map((contractor) => contractor.finisher))];

// eslint-disable-next-line no-restricted-syntax
for (const finisher of finishers) {
    const finisherReadyToUploadDir = `${config.contractorsZonePath}\\${finisher}\\${instanceRunDateFormatted}\\${readyToUpload}`;
    // Check ReadyToUpload folder exists.
    if (!fs.existsSync(finisherReadyToUploadDir)) {
        lgw(`Finisher's ReadyToUpload folder doesn't exist: ${finisherReadyToUploadDir}, Ignoring.`);
        // eslint-disable-next-line no-continue
        continue;
    }

    // Get all the folders which are not holding any locks
    const unlockedFolders = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const finisherReadyToUploadSubFolderAndFiles of fs.readdirSync(finisherReadyToUploadDir)) {
        const finisherReadyToUploadSubFolderPath = path.join(finisherReadyToUploadDir, finisherReadyToUploadSubFolderAndFiles);
        const finisherReadyToUploadStat = fs.statSync(finisherReadyToUploadSubFolderPath);
        if (finisherReadyToUploadStat.isDirectory()) {
            try {
                fs.renameSync(finisherReadyToUploadSubFolderPath, `${finisherReadyToUploadSubFolderPath} `);
                fs.renameSync(`${finisherReadyToUploadSubFolderPath} `, finisherReadyToUploadSubFolderPath.trim());
                unlockedFolders.push(finisherReadyToUploadSubFolderAndFiles);
            } catch (err) {
                lgw(
                    `Folder in Finisher's ReadyToUpload locked, maybe a contractor working/moving it, Filename: ${finisher}\\${readyToUpload}\\${finisherReadyToUploadSubFolderAndFiles}, Ignoring.`
                );
            }
        }
    }

    // eslint-disable-next-line no-restricted-syntax
    for (let finisherReadyToUploadSubFolderAndFiles of unlockedFolders) {
        let isOverwrite = false;
        let finisherReadyToUploadSubFolderPath = path.join(finisherReadyToUploadDir, finisherReadyToUploadSubFolderAndFiles);
        const finisherReadyToUploadStat = fs.statSync(finisherReadyToUploadSubFolderPath);
        // Check ReadyToUpload item is a folder
        if (!finisherReadyToUploadStat.isDirectory()) {
            lgw(
                `Found a file in Finisher's ReadyToUpload directory, Filename: ${finisher}\\${readyToUpload}\\${finisherReadyToUploadSubFolderAndFiles}, Ignoring.`
            );
            // eslint-disable-next-line no-continue
            continue;
        }

        // Check ReadyToUpload folder has OK_AlreadyMoved_ prefixed to it, if has set overwrite to true and rename the folder to proper format
        if (/^[O|o][K|k]_AlreadyMoved_(\d[\S]*)(?: ([\S| ]*))? ([\S]+) (\d{1,3}) (\(#\d{5}\))$/.test(finisherReadyToUploadSubFolderAndFiles)) {
            const folderWithOkAlreadMovedRemoved = path.basename(finisherReadyToUploadSubFolderPath).replace(/^[O|o][K|k]_AlreadyMoved_/, '');
            const newFinisherFinishingDoneSubFolderPath = `${path.dirname(finisherReadyToUploadSubFolderPath)}/${folderWithOkAlreadMovedRemoved}`;
            fs.renameSync(finisherReadyToUploadSubFolderPath, newFinisherFinishingDoneSubFolderPath);
            finisherReadyToUploadSubFolderAndFiles = folderWithOkAlreadMovedRemoved;
            finisherReadyToUploadSubFolderPath = path.join(finisherReadyToUploadDir, finisherReadyToUploadSubFolderAndFiles);
            isOverwrite = true;
        }

        // Check ReadyToUpload folder has AlreadyMoved_ prefixed to it, if has ignore the folder
        if (/^AlreadyMoved_.*$/.test(finisherReadyToUploadSubFolderAndFiles)) {
            // eslint-disable-next-line no-continue
            continue;
        }

        // Check ReadyToUpload folder matches the format
        const regexToMatchFolderName = /^(\d[\S]*)(?: ([\S| ]*))? ([\S]+) (\d{1,3}) (\(#\d{5}\))$/;
        if (!regexToMatchFolderName.test(finisherReadyToUploadSubFolderAndFiles)) {
            lgw(
                `Folder in ReadyToUpload but is not in a proper format, Folder: ${finisher}\\${readyToUpload}\\${finisherReadyToUploadSubFolderAndFiles}, Ignoring.`
            );
            // eslint-disable-next-line no-continue
            continue;
        }
        const numberOfImagesAcToFolderName = parseInt(getNumberOfImagesFromAllottedDealerNumberFolder(finisherReadyToUploadSubFolderAndFiles), 10);
        const numberOfImagesAcToFileCount = getFileCountRecursively(finisherReadyToUploadSubFolderPath);
        // Check ReadyToUpload folder filecount matches as mentioned in the folder
        if (numberOfImagesAcToFolderName !== numberOfImagesAcToFileCount) {
            lgw(
                `Folder in ReadyToUpload but images quantity does not match, Folder: ${finisher}\\${readyToUpload}\\${finisherReadyToUploadSubFolderAndFiles}, Images Qty ac to folder name: ${numberOfImagesAcToFolderName} and  Images Qty present in the folder: ${numberOfImagesAcToFileCount}, Ignoring.`
            );
            // eslint-disable-next-line no-continue
            continue;
        }
        const matches = finisherReadyToUploadSubFolderAndFiles.match(regexToMatchFolderName);
        const uniqueCode = matches[matches.length - 1];
        let cuttingDoneBy = null;
        // eslint-disable-next-line no-restricted-syntax
        for (const contractorInSubLoop of Object.keys(config.contractors)) {
            const contractorDoneSubFolderDir = `${config.contractorsRecordKeepingPath}\\${contractorInSubLoop}_Acnt\\${cuttingAccounting}\\${instanceRunDateFormatted}\\${finisherReadyToUploadSubFolderAndFiles}`;
            // const contractorDoneSubFolderDir = `${config.contractorsZonePath}\\${contractorInSubLoop}\\${instanceRunDateFormatted}\\000_Done\\${contractorReadyToUploadSubFolderAndFiles}`;
            if (fs.existsSync(contractorDoneSubFolderDir)) {
                cuttingDoneBy = contractorInSubLoop;
                break;
            }
        }
        if (cuttingDoneBy == null) {
            lgw(
                `Folder present in 'ReadyToUpload' but not present in 'CuttingAccounting' folder for reporting, Folder: ${finisher}\\${readyToUpload}\\${finisherReadyToUploadSubFolderAndFiles}, Ignoring.`
            );
            // eslint-disable-next-line no-continue
            continue;
        }
        if (!reportJSONObj[uniqueCode]) {
            lgw(
                `Todays report json file '${instanceRunDateFormatted}_report.json' does not contain a key '${uniqueCode}', which should have been created while allotment, Exiting.`
            );
            // eslint-disable-next-line no-continue
            continue;
        }
        if (path.basename(finisherReadyToUploadSubFolderAndFiles) !== reportJSONObj[uniqueCode].allotmentFolderName) {
            lgw(
                `The allotment folder name '${
                    reportJSONObj[uniqueCode].allotmentFolderName
                }' does not match folder name coming back for uploading '${path.basename(
                    finisherReadyToUploadSubFolderPath
                )}', probably some contractor has modified the folder name, Exiting.`
            );
            // eslint-disable-next-line no-continue
            continue;
        }
        const folderSize = getFolderSizeInBytes(finisherReadyToUploadSubFolderPath);
        foldersToShift.push({
            dealerImagesFolder: finisherReadyToUploadSubFolderPath,
            folderSize: folderSize,
            uniqueCode: uniqueCode,
            cuttingDoneBy: cuttingDoneBy,
            finisher: finisher,
            isOverwrite: isOverwrite,
        });
    }
}

foldersToShift.sort((a, b) => {
    const regex = /(\d+)/;
    if (!regex.test(path.basename(a.dealerImagesFolder)) || !regex.test(path.basename(b.dealerImagesFolder))) {
        lgc('Unable to match regex of `foldersToShift` while sorting.');
        return 0;
    }
    const numA = Number(path.basename(a.dealerImagesFolder).match(regex)[0]);
    const numB = Number(path.basename(b.dealerImagesFolder).match(regex)[0]);
    return numA - numB;
});
// TODO: This sleep was induced to check folderSizeAfter10Seconds functionality, to be removed if the above locking system works properly.
// sleep(15);
// console.log(foldersToShift);

foldersToShift = moveFilesFromContractorsToUploadingZoneAndFinishingAccounting(foldersToShift, true);
moveFilesFromContractorsToUploadingZoneAndFinishingAccounting(foldersToShift, false);

if (!fs.existsSync(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`)) {
    console.log(chalk.cyan(`No data present in the uploading zone, Exiting.`));
    process.exit(0);
}

const foldersToUpload = {};
// eslint-disable-next-line no-restricted-syntax
for (const uploadingZoneSubFolderAndFiles of fs.readdirSync(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`)) {
    const uploadingZoneSubFolderPath = path.join(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`, uploadingZoneSubFolderAndFiles);
    const uploadingZoneStat = fs.statSync(uploadingZoneSubFolderPath);

    if (uploadingZoneStat.isDirectory()) {
        // console.log(uploadingZoneSubFolderPath);
        const uniqueId = getUniqueIDFromAllottedDealerNumberFolder(uploadingZoneSubFolderAndFiles);
        const numberOfImagesAcToFolderName = parseInt(getNumberOfImagesFromAllottedDealerNumberFolder(uploadingZoneSubFolderAndFiles), 10);
        foldersToUpload[uniqueId] = {
            path: uploadingZoneSubFolderPath,
            imagesQty: numberOfImagesAcToFolderName,
            dealerFolderFilesQty: getFileCountNonRecursively(uploadingZoneSubFolderPath),
        };
    }
}

// foldersToShift = foldersToShift.map((folderToShift) => folderToShift.slice(0, -1));
// const foldersToShiftObj = foldersToShift.reduce((foldersToShiftArr, [value, key]) => {
//     foldersToShiftArr[key] = value;
//     return foldersToShiftArr;
// }, {});

// TODO: Shift folders here to uploaddirectory
// console.log(foldersToShift);
// console.log(foldersToShiftObj);

const uniqueIdOfFoldersShifted = Object.keys(foldersToUpload); // foldersToShift.map((item) => item[1]);
// console.log(uniqueIdOfFoldersShifted);

if (
    !(
        true && // validateConfigFile()
        // // TODO: validateBookmarksAndCheckCredentialsPresent() => Dealer Name space in the middle gives validation error which it shoudl not
        [validateDealerConfigurationExcelFile() !== 'error', validateBookmarksAndCheckCredentialsPresent() !== 'error'].every((i) => i)
    )
) {
    console.log(chalk.white.bgRed.bold(`Please correct the above errors, in order to continue.`));
    if (config.environment === 'production') {
        process.exit(1);
    }
}

// await killChrome({
//     includingMainProcess: true,
// });

/**
 * Read chrome bookmarks from chrome browser
 */
const allUsernamesBookmarks = getAllUsernamesBookmarks();

(async () => {
    let page = false;
    let browser = false;
    let userLoggedIn = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        console.log(chalk.cyan(`Uploading bookmarks for the Username: ${chalk.cyan.bold(usernameBookmark.name)}`));
        const credentials = getCredentialsForUsername(usernameBookmark.name);

        setCurrentDealerConfiguration(usernameBookmark.name);
        const allottedDealerLevelBookmarks = usernameBookmark.children.filter((dealerLevelBookmark) => dealerLevelBookmark.name.includes(' |#| '));
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of allottedDealerLevelBookmarks) {
            // console.log(dealerLevelBookmark.name);
            // eslint-disable-next-line no-continue
            // continue;

            const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
            const uniqueIdArr = getUniqueIdPairsFromDealerBookmarkName(dealerLevelBookmark.name);

            const uniqueIdArrCommonInUploadDiretoryAndBookmarksName = uniqueIdArr.filter((value) => uniqueIdOfFoldersShifted.includes(value));
            // const isDealerFolderToBeUploaded = uniqueIdArr.some((item) => uniqueIdOfFoldersShifted.includes(item));
            // eslint-disable-next-line no-restricted-syntax
            for (const uniqueIdElement of uniqueIdArrCommonInUploadDiretoryAndBookmarksName) {
                // if (isDealerFolderToBeUploaded) {
                console.log(
                    chalk.cyan('Uploading bookmarks for the Dealer: ') +
                        chalk.cyan.bold(dealerLevelBookmarkName) +
                        chalk.cyan(' from the Username: ') +
                        chalk.cyan.bold(usernameBookmark.name)
                );
                const vehicleBookmarks = dealerLevelBookmark.children;

                // eslint-disable-next-line no-restricted-syntax
                for (const vehicleBookmark of vehicleBookmarks) {
                    if (vehicleBookmark.url.endsWith('#general')) {
                        vehicleBookmark.url = vehicleBookmark.url.replace('#general', '#imagery');
                    } else if (!vehicleBookmark.url.includes('#')) {
                        vehicleBookmark.url += '#imagery';
                    }
                    if (vehicleBookmark.name.includes(' |#| ') && !vehicleBookmark.name.split(' |#| ')[1].startsWith('Ignoring')) {
                        console.log(chalk.whiteBright.bgCyan(getUploadRemainingSummary(foldersToUpload)));
                        if (typeof page === 'boolean' && !page) {
                            ({ page, browser } = await initBrowserAndGetPage('upload'));
                        }
                        if (userLoggedIn !== usernameBookmark.name) {
                            const currentURL = await gotoURL(page, vehicleBookmark.url);
                            const currentUser = await getCurrentUser(page);

                            let parsedCurrentUrl = new URL(currentURL);
                            parsedCurrentUrl = parsedCurrentUrl.host + parsedCurrentUrl.pathname;

                            let parsedVehicleBookmarkURL = new URL(vehicleBookmark.url);
                            parsedVehicleBookmarkURL = parsedVehicleBookmarkURL.host + parsedVehicleBookmarkURL.pathname;

                            if (currentUser !== usernameBookmark.name.toLowerCase() || parsedCurrentUrl !== parsedVehicleBookmarkURL) {
                                await loginCredentials(page, credentials);
                            }
                            userLoggedIn = usernameBookmark.name;
                        }

                        // console.log(vehicleBookmark.name);
                        const returnObj = await uploadBookmarkURL(
                            page,
                            uniqueIdElement,
                            foldersToUpload[uniqueIdElement].path,
                            dealerLevelBookmarkName,
                            vehicleBookmark.name,
                            vehicleBookmark.url,
                            userLoggedIn
                        );
                        if (
                            returnObj.result === true ||
                            (returnObj.result === false && returnObj.bookmarkAppendMesg === 'Ignoring (Does not Exist)')
                        ) {
                            createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(returnObj.moveSource, returnObj.moveDestination, 2);
                        }
                        foldersToUpload[uniqueIdElement].imagesQty = getFileCountRecursively(foldersToUpload[uniqueIdElement].path);
                        foldersToUpload[uniqueIdElement].dealerFolderFilesQty = getFileCountNonRecursively(foldersToUpload[uniqueIdElement].path);
                    }
                }
            }
        }
    }
    if (typeof browser !== 'boolean') {
        await browser.close();
    }
})();
// await sleep(10000);
// process.exit(0);
