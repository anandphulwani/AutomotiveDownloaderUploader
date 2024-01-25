import { spawn } from 'child_process';
import { URL as URLparser } from 'url';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { getCredentialsForUsername, getLastLotDate, getLastLotNumber, getLotConfigPropertiesValues } from './functions/configsupportive.js';
import { sleep, waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import { checkTimezone, checkTimeWithNTP } from './functions/time.js';
import { getAllUsernamesBookmarks, getRemainingBookmarksNotDownloadedLength } from './functions/bookmarksupportive.js';
import { initBrowserAndGetPage, loginCredentials, getCurrentUser } from './functions/browsersupportive.js';
import { gotoURL } from './functions/goto.js';
import {
    downloadBookmarksFromSourceToProcessing,
    handleBookmarkURL,
    replaceBookmarksElementByGUIDAndWriteToBookmarksFile,
} from './functions/bookmark.js';
import { setCurrentDealerConfiguration } from './functions/excelsupportive.js';
import { validateDealerConfigurationExcelFile } from './functions/excelvalidation.js';
import { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText } from './functions/bookmarkvalidation.js';
import { checkCredentialsBlock, validateConfigFile } from './functions/configvalidation.js';
import { getListOfSubfoldersStartingWith } from './functions/filesystem.js';
import { autoCleanUpDatastoreZones } from './functions/datastoresupportive.js';
import { lge, lgi, lgu, lgwc } from './functions/loggerandlocksupportive.js';
import Color from './class/Colors.js';
import LineSeparator from './class/LineSeparator.js';
import LoggingPrefix from './class/LoggingPrefix.js';
import { clearLastLinesOnConsole } from './functions/consolesupportive.js';
import checkBrowserClosed from './functions/browserclosed.js';
import syncOperationWithErrorHandling from './functions/syncOperationWithErrorHandling.js';
import { getRowPosOnTerminal } from './functions/terminal.js';
import { addMoreBookmarksOrAllotmentRemainingImagesPrompt, bookmarkNotAppended, getCurrentLotDetails } from './functions/download.js';
import { launchLotWindow } from './functions/allotmentsupportive.js';
/* eslint-enable import/extensions */

/**
 *
 * Only make a single instance run of the script.
 *
 */
try {
    if (checkSync('downloader.js', { stale: 15000 })) {
        lgwc('Lock already held, another instace is already running.');
        process.exit(1);
    }
    syncOperationWithErrorHandling(lockSync, 'downloader.js', { stale: 15000 });
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

// ONPROJECTFINISH: Check 'await page.waitForFunction' as it might create problems, removed from everywhere, just search it once again to verify.

if (
    validateConfigFile() === 'error' ||
    (await downloadBookmarksFromSourceToProcessing()) || // Check whether config is valid, then only update bookmarks first and then run `validateBookmarksAndCheckCredentialsPresent`
    [validateDealerConfigurationExcelFile() === 'error', validateBookmarksAndCheckCredentialsPresent() === 'error'].some((i) => i)
) {
    lge(`Please correct the above errors, in order to continue.`);
    if (config.environment === 'production') {
        process.exit(1);
    }
}
await checkCredentialsBlock();
if (config.environment !== 'production') {
    lge('Application currently not running in production mode, please switch to production mode immediately.');
}

if (config.environment === 'production' && !checkSync('contractors_folderTransferer.js', { stale: 15000 })) {
    const subprocess = spawn('FolderTransferer.exe', [], {
        detached: true,
        stdio: 'ignore',
    });
    subprocess.unref();
}

const LotIndexArray = getListOfSubfoldersStartingWith(`${config.downloadPath}\\${instanceRunDateFormatted}`, 'Lot_');
let LotLastIndex = LotIndexArray.length > 0 ? parseInt(LotIndexArray[LotIndexArray.length - 1].substring(4), 10) : null;
if (LotLastIndex === null) {
    if (getLastLotDate() === instanceRunDateFormatted) {
        LotLastIndex = parseInt(getLastLotNumber().substring(4), 10) + 1;
    } else {
        LotLastIndex = 1;
    }
}
LotIndexArray.pop();

// eslint-disable-next-line no-restricted-syntax
for (const LotIndexEle of LotIndexArray) {
    const lotIndexToAllot = parseInt(LotIndexEle.substring(4), 10);
    launchLotWindow(lotIndexToAllot);
    sleep(3);
}

try {
    let lastRunTime = Date.now();
    let lotIndex = LotLastIndex;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        const remainingBookmarksNotDownloadedLength = getRemainingBookmarksNotDownloadedLength();
        if (remainingBookmarksNotDownloadedLength > 0) {
            /**
             * Read chrome bookmarks from chrome browser
             */
            const allUsernamesBookmarks = getAllUsernamesBookmarks();

            // Create a set of all completed bookmarks to compare for duplicates
            let urlsDownloaded = {};
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameBookmark of allUsernamesBookmarks) {
                const dealerLevelBookmarks = usernameBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const vehicleBookmarks = dealerLevelBookmark.children;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const vehicleBookmark of vehicleBookmarks) {
                        if (vehicleBookmark.name.includes('|#|')) {
                            let vehicleBookmarkUrlWOQueryParams = new URLparser(vehicleBookmark.url);
                            vehicleBookmarkUrlWOQueryParams = vehicleBookmarkUrlWOQueryParams.host + vehicleBookmarkUrlWOQueryParams.pathname;
                            urlsDownloaded[vehicleBookmarkUrlWOQueryParams] = dealerLevelBookmark.name;
                        }
                    }
                }
            }

            /**
             * Get dealerFolderCntInLot and imagesQtyInLot, before downloading any URL
             * because at times before counting the count of these, some fresh folders
             * in the middle starts getting downloaded which messes up the result of folders/qty
             * which doesn't match the lot configuration
             */
            let dealerFolderCntInLot = 0;
            let imagesQtyInLot = 0;
            ({ dealerFolderCntInLot, imagesQtyInLot } = getCurrentLotDetails(lotIndex));

            let page = false;
            let browser = false;
            let userLoggedIn = '';
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameBookmark of allUsernamesBookmarks) {
                lgi(`Reading bookmarks for the Username: `, LineSeparator.false);
                lgi(usernameBookmark.name, Color.cyan, LoggingPrefix.false);
                const credentials = getCredentialsForUsername(usernameBookmark.name);

                setCurrentDealerConfiguration(usernameBookmark.name);
                const dealerLevelBookmarks = usernameBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
                    const { lotCfgMinDealerFolders, lotCfgImagesQty } = getLotConfigPropertiesValues(lotIndex);
                    if (
                        (lotCfgMinDealerFolders === undefined || dealerFolderCntInLot >= lotCfgMinDealerFolders) &&
                        (lotCfgImagesQty === undefined || imagesQtyInLot >= lotCfgImagesQty)
                    ) {
                        launchLotWindow(lotIndex);
                        dealerFolderCntInLot = 0;
                        imagesQtyInLot = 0;
                        lotIndex++;
                    }
                    lgi('Reading bookmarks for the Dealer: ', LineSeparator.false);
                    lgi(dealerLevelBookmarkName, Color.cyan, LoggingPrefix.false, LineSeparator.false);
                    lgi(' from the Username: ', LoggingPrefix.false, LineSeparator.false);
                    lgi(usernameBookmark.name, Color.cyan, LoggingPrefix.false);
                    const vehicleBookmarks = dealerLevelBookmark.children;

                    // eslint-disable-next-line no-restricted-syntax
                    for (const vehicleBookmark of vehicleBookmarks) {
                        if (!vehicleBookmark.name.includes(' |#| ')) {
                            if (typeof page === 'boolean' && !page) {
                                ({ page, browser } = await initBrowserAndGetPage('download', false));
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

                            const returnObj = await handleBookmarkURL(
                                page,
                                lotIndex,
                                usernameBookmark.name,
                                dealerLevelBookmarkName,
                                vehicleBookmark.name,
                                vehicleBookmark.url,
                                urlsDownloaded
                            );
                            urlsDownloaded = returnObj.urlsDownloaded;
                            if (config.isUpdateBookmarksOnceDone && returnObj.bookmarkAppendMesg !== '') {
                                replaceBookmarksElementByGUIDAndWriteToBookmarksFile('name', vehicleBookmark.guid, returnObj.bookmarkAppendMesg);
                            } else {
                                bookmarkNotAppended(returnObj, lotIndex, usernameBookmark, dealerLevelBookmarkName, vehicleBookmark);
                            }
                            await waitForSeconds(0);
                        }
                    }
                    ({ dealerFolderCntInLot, imagesQtyInLot } = getCurrentLotDetails(lotIndex));
                }
            }
            if (typeof browser !== 'boolean') {
                lgi('Waiting for the browser to close, in order to continue.', LineSeparator.false);
                await browser.close();
                lgi('..........Done', LoggingPrefix.false);
            }
            lastRunTime = Date.now();
        } else if (Date.now() - lastRunTime > 2 * 60 * 60 * 1000 /* 2 hours in milliseconds */) {
            break;
        }
        const resultOfKeyInYNToAddMoreBookmarksAnswer = await addMoreBookmarksOrAllotmentRemainingImagesPrompt(remainingBookmarksNotDownloadedLength);
        if (!resultOfKeyInYNToAddMoreBookmarksAnswer) {
            break;
        }
        const inLoopRowBeforeValidation = await getRowPosOnTerminal();
        // eslint-disable-next-line no-constant-condition
        while (true) {
            if (
                (await downloadBookmarksFromSourceToProcessing()) ||
                [validateDealerConfigurationExcelFile() === 'error', validateBookmarksAndCheckCredentialsPresent() === 'error'].some((i) => i)
            ) {
                lge(`Please correct the above errors, in order to continue.`);
                await waitForSeconds(30);
                const inLoopRowAfterValidation = await getRowPosOnTerminal();
                clearLastLinesOnConsole(inLoopRowAfterValidation - inLoopRowBeforeValidation);
                // eslint-disable-next-line no-continue
                continue;
            }
            break;
        }
    }
    launchLotWindow(lotIndex);
} catch (err) {
    checkBrowserClosed(err, false);
}
lgi('Program has ended successfully.', Color.bgWhite);
process.exit(0);
