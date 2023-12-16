import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { exec, spawn } from 'child_process';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { currentTimeWOMSFormatted, instanceRunDateFormatted, instanceRunDateWODayFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { attainLock, releaseLock, lgw, lge, lgc, lgi, lgu, lgd } from './functions/loggerandlocksupportive.js';
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
    getUniqueIDWithHashFromAllottedDealerNumberFolder,
} from './functions/datastoresupportive.js';
import { initBrowserAndGetPage, loginCredentials, getCurrentUser } from './functions/browsersupportive.js';
import { uploadBookmarkURL } from './functions/upload.js';
import { moveFilesFromSourceToDestinationAndAccounting, validationBeforeMoving } from './functions/contractors_folderTransferersupportive.js';
import Color from './class/Colors.js';
import LineSeparator from './class/LineSeparator.js';
import LoggingPrefix from './class/LoggingPrefix.js';
/* eslint-enable import/extensions */

const debug = false;
/**
 *
 * Only make a single instance run of the script.
 *
 */
try {
    if (checkSync('uploader.js', { stale: 15000 })) {
        throw new Error('Lock already held, another instace is already running.');
    }
    lockSync('uploader.js', { stale: 15000 });
} catch (error) {
    process.exit(1);
}

if (config.environment === 'production') {
    checkTimezone();
    printSectionSeperator();

    await checkTimeWithNTP();
    printSectionSeperator();
}
autoCleanUpDatastoreZones();
printSectionSeperator();

// TODO: validate config file here
if (!checkSync('contractors_folderTransferer.js', { stale: 15000 })) {
    exec(`start "" FolderTransferer.exe`);
}

// const cuttingDone = config.cutterProcessingFolders[0];
// const finishingBuffer = config.finisherProcessingFolders[0];
// const readyToUpload = config.finisherProcessingFolders[1];

// const cuttingAccounting = config.cutterRecordKeepingFolders[0];
// const finishingAccounting = config.finisherRecordKeepingFolders[0];

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

let foldersToShift = validationBeforeMoving('uploadingZone', reportJSONObj, debug);

foldersToShift = moveFilesFromSourceToDestinationAndAccounting('uploadingZone', foldersToShift, true);
moveFilesFromSourceToDestinationAndAccounting('uploadingZone', foldersToShift, false);

if (!fs.existsSync(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`)) {
    lgi(`No data present in the uploading zone, Exiting.`, Color.green);
    process.exit(0);
}

const foldersToUpload = {};
// eslint-disable-next-line no-restricted-syntax
for (const uploadingZoneSubFolderAndFiles of fs.readdirSync(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`)) {
    const uploadingZoneSubFolderPath = path.join(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`, uploadingZoneSubFolderAndFiles);
    const uploadingZoneStat = fs.statSync(uploadingZoneSubFolderPath);

    if (uploadingZoneStat.isDirectory()) {
        debug ? lgd(`uploadingZoneSubFolderPath: ${uploadingZoneSubFolderPath}`) : null;
        const uniqueId = getUniqueIDFromAllottedDealerNumberFolder(uploadingZoneSubFolderAndFiles);
        const numberOfImagesAcToFolderName = parseInt(getNumberOfImagesFromAllottedDealerNumberFolder(uploadingZoneSubFolderAndFiles), 10);
        foldersToUpload[uniqueId] = {
            path: uploadingZoneSubFolderPath,
            imagesQty: numberOfImagesAcToFolderName,
            dealerFolderFilesQty: getFileCountNonRecursively(uploadingZoneSubFolderPath),
        };
    }
}

// TODO: Shift folders here to uploaddirectory
debug ? lgd(`foldersToShift :${foldersToShift}`) : null;

const uniqueIdOfFoldersShifted = Object.keys(foldersToUpload); // foldersToShift.map((item) => item[1]);
debug ? lgd(`uniqueIdOfFoldersShifted :${uniqueIdOfFoldersShifted}`) : null;

if (
    !(
        true && // validateConfigFile()
        // // TODO: validateBookmarksAndCheckCredentialsPresent() => Dealer Name space in the middle gives validation error which it shoudl not
        [validateDealerConfigurationExcelFile() !== 'error', validateBookmarksAndCheckCredentialsPresent() !== 'error'].every((i) => i)
    )
) {
    lge(`Please correct the above errors, in order to continue.`);
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

try {
    let page = false;
    let browser = false;
    let userLoggedIn = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        lgi(`Uploading bookmarks for the Username: `, LineSeparator.false);
        lgi(usernameBookmark.name, Color.cyan, LoggingPrefix.false);
        const credentials = getCredentialsForUsername(usernameBookmark.name);

        setCurrentDealerConfiguration(usernameBookmark.name);
        const allottedDealerLevelBookmarks = usernameBookmark.children.filter((dealerLevelBookmark) => dealerLevelBookmark.name.includes(' |#| '));
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of allottedDealerLevelBookmarks) {
            debug ? lgd(`dealerLevelBookmark.name :${dealerLevelBookmark.name}`) : null;
            // eslint-disable-next-line no-continue
            // continue;

            const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
            const uniqueIdArr = getUniqueIdPairsFromDealerBookmarkName(dealerLevelBookmark.name);

            const uniqueIdArrCommonInUploadDiretoryAndBookmarksName = uniqueIdArr.filter((value) => uniqueIdOfFoldersShifted.includes(value));
            // const isDealerFolderToBeUploaded = uniqueIdArr.some((item) => uniqueIdOfFoldersShifted.includes(item));
            // eslint-disable-next-line no-restricted-syntax
            for (const uniqueIdElement of uniqueIdArrCommonInUploadDiretoryAndBookmarksName) {
                // if (isDealerFolderToBeUploaded) {
                lgi('Uploading bookmarks for the Dealer: ', LineSeparator.false);
                lgi(dealerLevelBookmarkName, Color.cyan, LoggingPrefix.false, LineSeparator.false);
                lgi(' from the Username: ', LoggingPrefix.false, LineSeparator.false);
                lgi(usernameBookmark.name, Color.cyan, LoggingPrefix.false);
                const vehicleBookmarks = dealerLevelBookmark.children;

                // eslint-disable-next-line no-restricted-syntax
                for (const vehicleBookmark of vehicleBookmarks) {
                    if (vehicleBookmark.url.endsWith('#general')) {
                        vehicleBookmark.url = vehicleBookmark.url.replace('#general', '#imagery');
                    } else if (!vehicleBookmark.url.includes('#')) {
                        vehicleBookmark.url += '#imagery';
                    }
                    if (vehicleBookmark.name.includes(' |#| ') && !vehicleBookmark.name.split(' |#| ')[1].startsWith('Ignoring')) {
                        lgi(getUploadRemainingSummary(foldersToUpload), Color.bgCyan);
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

                        debug ? lgd(`vehicleBookmark.name :${vehicleBookmark.name}`) : null;
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
                            createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(returnObj.moveSource, returnObj.moveDestination, false, 2);
                        }
                        foldersToUpload[uniqueIdElement].imagesQty = getFileCountRecursively(foldersToUpload[uniqueIdElement].path);
                        foldersToUpload[uniqueIdElement].dealerFolderFilesQty = getFileCountNonRecursively(foldersToUpload[uniqueIdElement].path);
                    }
                }
            }
        }
    }
    if (typeof browser !== 'boolean') {
        lgi('Waiting for the browser to close, in order to continue.');
        await browser.close();
        lgi('..........Done', LoggingPrefix.false);
    }
} catch (err) {
    if (
        err.message === 'Navigation failed because browser has disconnected!' ||
        err.message === 'Protocol error (Page.navigate): Session closed. Most likely the page has been closed.'
    ) {
        lgi('Browser has been manually closed.', Color.bgYellow);
    } else {
        throw err;
    }
}
