import fs from 'fs';
import path from 'path';
import { URL } from 'url';
import { spawn } from 'child_process';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted, instanceRunDateWODayFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { lge, lgi, lgu, lgd, lgif, lgwc, lgw, lgcf } from './functions/loggerandlocksupportive.js';
import { waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import {
    getAllUsernamesBookmarks,
    getRemainingBookmarksNotDownloadedLength,
    getUniqueIDsOfBookmarkFoldersAllotted,
} from './functions/bookmarksupportive.js';
import { gotoURL } from './functions/goto.js';
import { checkTimezone, checkTimeWithNTP } from './functions/time.js';
import { getUniqueIdPairsFromDealerBookmarkName } from './functions/bookmark.js';
import { getCredentialsForUsername } from './functions/configsupportive.js';
import { setCurrentDealerConfiguration } from './functions/excelsupportive.js';
import { validateDealerConfigurationExcelFile } from './functions/excelvalidation.js';
import { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText } from './functions/bookmarkvalidation.js';
import { getUnderProcessingAcToReport, readAndUpdateReportJSONObj } from './functions/reportsupportive.js';
import { validateConfigFile } from './functions/configvalidation.js';
import {
    getFileCountNonRecursively,
    getFileCountRecursively,
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty,
} from './functions/filesystem.js';
import { autoCleanUpDatastoreZones, getUploadRemainingSummary } from './functions/datastoresupportive.js';
import { initBrowserAndGetPage, loginCredentials, getCurrentUser } from './functions/browsersupportive.js';
import {
    getFoldersInUploadingZone,
    getFoldersInUploadingZoneWithUniqueIDs,
    typeOfVINPathAndOtherVars,
    uploadBookmarkURL,
} from './functions/upload.js';
import {
    checkIfFoldersPresentInFinishersUploadingZoneDir,
    moveFilesFromSourceToDestinationAndAccounting,
    validationBeforeMoving,
} from './functions/contractors_folderTransferersupportive.js';
import Color from './class/Colors.js';
import LineSeparator from './class/LineSeparator.js';
import LoggingPrefix from './class/LoggingPrefix.js';
import keyInYNWithTimeout from './functions/keyInYNWithTimeout.js';
import { levels, loggerConsoleLevel } from './functions/logger.js';
import { clearLastLinesOnConsole } from './functions/consolesupportive.js';
import checkBrowserClosed from './functions/browserclosed.js';
import syncOperationWithErrorHandling from './functions/syncOperationWithErrorHandling.js';
/* eslint-enable import/extensions */

const debug = false;
/**
 *
 * Only make a single instance run of the script.
 *
 */
try {
    if (checkSync('uploader.js', { stale: 15000 })) {
        lgwc('Lock already held, another instace is already running.');
        process.exit(1);
    }
    syncOperationWithErrorHandling(lockSync, 'uploader.js', { stale: 15000 });
} catch (error) {
    lgu('Unable to checkSync or lockSync.', error);
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

if (
    validateConfigFile() === 'error' ||
    [validateDealerConfigurationExcelFile() === 'error', validateBookmarksAndCheckCredentialsPresent() === 'error'].some((i) => i)
) {
    lge(`Please correct the above errors, in order to continue.`);
    if (config.environment === 'production') {
        process.exit(1);
    }
}

if (config.environment === 'production' && !checkSync('contractors_folderTransferer.js', { stale: 15000 })) {
    const subprocess = spawn('FolderTransferer.exe', [], {
        detached: true,
        stdio: 'ignore',
    });
    subprocess.unref();
}

// await killChrome({
//     includingMainProcess: true,
// });

const reportJSONFilePath = path.join(config.reportsJSONPath, instanceRunDateWODayFormatted, `${instanceRunDateFormatted}_report.json`);
let reportJSONObj;
let isDumbUploader = false;
if (!syncOperationWithErrorHandling(fs.existsSync, reportJSONFilePath)) {
    lge(`Todays report json file '${instanceRunDateFormatted}_report.json' was not created while allotment, Shifting to DUMB uploader mode.`);
    isDumbUploader = true;
}

try {
    let foundNewFoldersInMiddle;
    let lastRunTime = Date.now();
    // eslint-disable-next-line no-constant-condition
    while (true) {
        foundNewFoldersInMiddle = false;
        if (!isDumbUploader) {
            reportJSONObj = readAndUpdateReportJSONObj(reportJSONFilePath);
            let foldersToShift = validationBeforeMoving('uploadingZone', reportJSONObj, debug);
            foldersToShift = moveFilesFromSourceToDestinationAndAccounting('uploadingZone', foldersToShift, true);
            moveFilesFromSourceToDestinationAndAccounting('uploadingZone', foldersToShift, false);
        } else {
            lgi('*'.repeat(120));
            lgi('*'.repeat(120));
            lgi(`${'*'.repeat(50)} DUMB UPLOADER MODE ${'*'.repeat(50)}`);
            lgi('*'.repeat(120));
            lgi('*'.repeat(120));
        }
        const foldersToUpload = getFoldersInUploadingZone(debug);
        debug ? lgd(`foldersToUpload :${foldersToUpload}`) : null;

        const uniqueIdOfFoldersShifted = Object.keys(foldersToUpload);
        debug ? lgd(`uniqueIdOfFoldersShifted :${uniqueIdOfFoldersShifted}`) : null;

        const uniqueIdOfBookmarkFoldersAllotted = getUniqueIDsOfBookmarkFoldersAllotted();
        debug ? lgd(`uniqueIdOfBookmarkFoldersAllotted :${uniqueIdOfBookmarkFoldersAllotted}`) : null;

        const [uniqueIdOfFoldersInBothShiftedAndBookmarks, uniqueIdOfFoldersInNotBookmarks] = uniqueIdOfFoldersShifted.reduce(
            (acc, element) => {
                if (uniqueIdOfBookmarkFoldersAllotted.includes(element)) {
                    acc[0].push(element);
                } else {
                    acc[1].push(element);
                }
                return acc;
            },
            [[], []]
        );

        // eslint-disable-next-line no-restricted-syntax
        for (const uploadingFoldersInNotBookmarks of getFoldersInUploadingZoneWithUniqueIDs(uniqueIdOfFoldersInNotBookmarks)) {
            lgw(
                `Folder's '${uploadingFoldersInNotBookmarks}' unique id of folder not found in bookmarks(probably deleted), to upload; redownload, reallot, replace contents of the folder.`
            );
        }

        if (uniqueIdOfFoldersInBothShiftedAndBookmarks.length > 0) {
            /**
             * Read chrome bookmarks from chrome browser
             */
            const allUsernamesBookmarks = getAllUsernamesBookmarks();

            let page = false;
            let browser = false;
            let userLoggedIn = '';
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameBookmark of allUsernamesBookmarks) {
                lgi(`Uploading bookmarks for the Username: `, LineSeparator.false);
                lgi(usernameBookmark.name, Color.cyan, LoggingPrefix.false);
                const credentials = getCredentialsForUsername(usernameBookmark.name);

                setCurrentDealerConfiguration(usernameBookmark.name);
                const allottedDealerLevelBookmarks = usernameBookmark.children.filter((dealerLevelBookmark) =>
                    dealerLevelBookmark.name.includes(' |#| ')
                );
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of allottedDealerLevelBookmarks) {
                    foundNewFoldersInMiddle = !isDumbUploader && checkIfFoldersPresentInFinishersUploadingZoneDir() ? true : foundNewFoldersInMiddle;
                    if (foundNewFoldersInMiddle) break;
                    debug ? lgd(`dealerLevelBookmark.name :${dealerLevelBookmark.name}`) : null;
                    const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
                    const uniqueIdArr = getUniqueIdPairsFromDealerBookmarkName(dealerLevelBookmark.name);

                    const uniqueIdArrCommonInUploadDiretoryAndBookmarksName = uniqueIdArr.filter((value) =>
                        uniqueIdOfFoldersInBothShiftedAndBookmarks.includes(value)
                    );
                    // eslint-disable-next-line no-restricted-syntax
                    for (const uniqueIdElement of uniqueIdArrCommonInUploadDiretoryAndBookmarksName) {
                        if (!syncOperationWithErrorHandling(fs.existsSync, foldersToUpload[uniqueIdElement].path)) {
                            lge(
                                `Unable to find dealer folder: '${path.basename(
                                    foldersToUpload[uniqueIdElement].path
                                )}' on the disk, data does not exist, probably folder has been picked out manually.`
                            );
                            // eslint-disable-next-line no-continue
                            continue;
                        }
                        lgi('Uploading bookmarks for the Dealer: ', LineSeparator.false);
                        lgi(dealerLevelBookmarkName, Color.cyan, LoggingPrefix.false, LineSeparator.false);
                        lgi(' from the Username: ', LoggingPrefix.false, LineSeparator.false);
                        lgi(usernameBookmark.name, Color.cyan, LoggingPrefix.false);
                        const vehicleBookmarks = dealerLevelBookmark.children;

                        // eslint-disable-next-line no-restricted-syntax
                        for (const vehicleBookmark of vehicleBookmarks) {
                            const afterHashStringInVehicleBookmark = vehicleBookmark.name.split(' |#| ')[1].trim();
                            if (vehicleBookmark.url.endsWith('#general')) {
                                vehicleBookmark.url = vehicleBookmark.url.replace('#general', '#imagery');
                            } else if (!vehicleBookmark.url.includes('#')) {
                                vehicleBookmark.url += '#imagery';
                            }
                            if (vehicleBookmark.name.includes(' |#| ') && !afterHashStringInVehicleBookmark.startsWith('Ignoring')) {
                                const { typeOfVINPath } = typeOfVINPathAndOtherVars(
                                    foldersToUpload[uniqueIdElement].path,
                                    afterHashStringInVehicleBookmark
                                );
                                if (typeOfVINPath === undefined) {
                                    lge(
                                        `Unable to find file/folder for the VIN number: '${afterHashStringInVehicleBookmark}' on the disk, data does not exist.`
                                    );
                                    // eslint-disable-next-line no-continue
                                    continue;
                                }

                                const uploadingSummary = getUploadRemainingSummary(foldersToUpload);
                                uploadingSummary.map((summaryLine) => lgi(summaryLine, Color.bgCyan));

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
                                let returnObj;
                                try {
                                    returnObj = await uploadBookmarkURL(
                                        page,
                                        uniqueIdElement,
                                        foldersToUpload[uniqueIdElement].path,
                                        dealerLevelBookmarkName,
                                        vehicleBookmark.name,
                                        vehicleBookmark.url,
                                        userLoggedIn,
                                        debug
                                    );
                                } catch (err) {
                                    lgw(
                                        `Unable to upload, \nfolder: '${path.basename(
                                            foldersToUpload[uniqueIdElement].path
                                        )}' for \ndealer bookmark: '${dealerLevelBookmarkName}', \nbookmark name: '${
                                            vehicleBookmark.name
                                        }', \nbookmark URL: '${vehicleBookmark.url}'.\n`,
                                        err
                                    );
                                    checkBrowserClosed(err, true);
                                    lgcf(err);
                                    lgwc('Waiting for 5 mins before continuing further.');
                                    await waitForSeconds(300);
                                }
                                if (
                                    returnObj.result === true ||
                                    (returnObj.result === false && returnObj.bookmarkAppendMesg === 'Ignoring (Does not Exist)')
                                ) {
                                    if (syncOperationWithErrorHandling(fs.existsSync, returnObj.moveSource)) {
                                        createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(
                                            returnObj.moveSource,
                                            returnObj.moveDestination,
                                            true,
                                            2
                                        );
                                    }
                                }
                                foldersToUpload[uniqueIdElement].imagesQty = getFileCountRecursively(foldersToUpload[uniqueIdElement].path);
                                foldersToUpload[uniqueIdElement].dealerFolderFilesQty = getFileCountNonRecursively(
                                    foldersToUpload[uniqueIdElement].path
                                );
                            }
                        }
                    }
                }
                if (foundNewFoldersInMiddle) break;
            }
            if (typeof browser !== 'boolean') {
                lgi('Waiting for the browser to close, in order to continue.', LineSeparator.false);
                await browser.close();
                lgi('..........Done', LoggingPrefix.false);
            }
            lastRunTime = Date.now();
            // eslint-disable-next-line no-continue
            if (foundNewFoldersInMiddle) continue;
        } else if (Date.now() - lastRunTime <= 15 * 60 * 1000 /* 15 mins in milliseconds */) {
            const remainingBookmarksNotDownloadedLength = getRemainingBookmarksNotDownloadedLength();
            if (remainingBookmarksNotDownloadedLength > 0) {
                lastRunTime = Date.now();
            } else {
                const underProcessingAcToReport = getUnderProcessingAcToReport();
                if (
                    underProcessingAcToReport.underProcessingDealerFolders !== undefined &&
                    underProcessingAcToReport.underProcessingDealerFolders > 0
                ) {
                    lastRunTime = Date.now();
                }
            }
        } else {
            break;
        }
        if (uniqueIdOfFoldersInBothShiftedAndBookmarks.length === 0) {
            lgi(`No data present in the uploading zone.`, Color.green);
            printSectionSeperator();
            const questionOfKeyInYNToUploadMoreBookmarks = 'Do you want to upload more bookmarks(Y), or exit(N)?';
            const resultOfKeyInYNToUploadMoreBookmarks = await keyInYNWithTimeout(questionOfKeyInYNToUploadMoreBookmarks, 25000, true);
            if (!resultOfKeyInYNToUploadMoreBookmarks.answer) {
                break;
            }
            if (resultOfKeyInYNToUploadMoreBookmarks.isDefaultOption) {
                printSectionSeperator(undefined, true);
                await waitForSeconds(5);
                const noOfLines = (levels[loggerConsoleLevel] >= levels.trace ? 4 : 2) + (isDumbUploader ? 5 : 0);
                clearLastLinesOnConsole(noOfLines);
                await waitForSeconds(5);
            } else {
                lgif(`${questionOfKeyInYNToUploadMoreBookmarks}: ${resultOfKeyInYNToUploadMoreBookmarks.answer}`);
            }
        }
    }
} catch (err) {
    checkBrowserClosed(err, false);
}
lgi('Program has ended successfully.', Color.bgWhite);
process.exit(0);
