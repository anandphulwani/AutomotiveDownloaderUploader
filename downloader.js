import chalk from 'chalk';
import fs from 'fs';
import killChrome from 'kill-chrome';
import puppeteer from 'puppeteer';
import { exec, spawn } from 'child_process';
import { keyInYN } from 'readline-sync';
import { URL as URLparser } from 'url';
import path from 'path';
import beautify from 'json-beautify';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted } from './functions/datetime.js';
import { config } from './configs/config.js';
import { getCredentialsForUsername, getAppDomain, getLotConfigPropertiesValues } from './functions/configsupportive.js';
import { zeroPad } from './functions/stringformatting.js';
import { msleep, sleep, waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import { checkTimezone, checkTimeWithNTP } from './functions/time.js';
import { getAllUsernamesBookmarks, getRemainingBookmarksNotDownloadedLength } from './functions/bookmarksupportive.js';
import keyInYNWithTimeout from './functions/keyInYNWithTimeout.js';
import { fillInTextbox, clickOnButton } from './functions/actionOnElements.js';
import { waitForElementContainsOrEqualsText, waitForElementContainsOrEqualsHTML, waitTillCurrentURLStartsWith } from './functions/waiting.js';
import { initBrowserAndGetPage, loginCredentials, getCurrentUser, checkBrowserClosed } from './functions/browsersupportive.js';
import { gotoURL, gotoPageAndWaitTillCurrentURLStartsWith } from './functions/goto.js';
import {
    downloadBookmarksFromSourceToProcessing,
    handleBookmarkURL,
    removeChecksumFromBookmarksObj,
    replaceBookmarksElementByGUIDAndWriteToBookmarksFile,
} from './functions/bookmark.js';
import { setCurrentDealerConfiguration } from './functions/excelsupportive.js';
import { validateDealerConfigurationExcelFile } from './functions/excelvalidation.js';
import { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText } from './functions/bookmarkvalidation.js';
import { validateConfigFile } from './functions/configvalidation.js';
import { getFileCountRecursively, getListOfSubfoldersStartingWith } from './functions/filesystem.js';
import { autoCleanUpDatastoreZones } from './functions/datastoresupportive.js';
import { getProjectLogsDirPath } from './functions/projectpaths.js';
import { lgc, lge, lgi, lgu } from './functions/loggerandlocksupportive.js';
import Color from './class/Colors.js';
import LineSeparator from './class/LineSeparator.js';
import LoggingPrefix from './class/LoggingPrefix.js';
/* eslint-enable import/extensions */

// const {
//     db: { host, port, name },
// } = config;
// console.log(`${host}:${port}/${name}`);
// console.log(config);

/**
 *
 * Only make a single instance run of the script.
 *
 */
try {
    if (checkSync('downloader.js', { stale: 15000 })) {
        throw new Error('Lock already held, another instace is already running.');
    }
    lockSync('downloader.js', { stale: 15000 });
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

await downloadBookmarksFromSourceToProcessing(false);

// ONPROJECTFINISH: Remove the unused imports
// NORMALPRIORITY: Error summary in the end.
// TODO: disallow same dealerNumber folders in a username folder, and same username folder in bookmark bar
// ONPROJECTFINISH:  resultCheck is declared outside, work out how to bring it inside the function
// ONPROJECTFINISH:  Decide whether to use bookmarkPath or bookmarksPath (with s in variable) and replace all bookmarks variable accordingly
// ONPROJECTFINISH: Check 'await page.waitForFunction' as it might create problems, removed from everywhere, just search it once again to verify.

// Non-shortcircuiting and: [f1(), f2()].every(i => i)
// Non-shortcircuiting or: [f1(), f2()].some(i => i)

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

if (!checkSync('contractors_folderTransferer.js', { stale: 15000 })) {
    exec(`start "" FolderTransferer.exe`);
}

// await killChrome({
//     includingMainProcess: true,
// });

const LotIndexArray = getListOfSubfoldersStartingWith(`${config.downloadPath}\\${instanceRunDateFormatted}`, 'Lot_');
let LotLastIndex = LotIndexArray.length > 0 ? parseInt(LotIndexArray[LotIndexArray.length - 1].substring(4), 10) : null;
if (LotLastIndex === null) {
    if (config.lotLastRunDate === instanceRunDateFormatted) {
        LotLastIndex = parseInt(config.lotLastRunNumber.substring(4), 10) + 1;
    } else {
        LotLastIndex = 1;
    }
}
LotIndexArray.pop();

// eslint-disable-next-line no-restricted-syntax
for (const LotIndexEle of LotIndexArray) {
    const lotIndexToAllot = parseInt(LotIndexEle.substring(4), 10);
    if (fs.existsSync(`${config.downloadPath}\\${instanceRunDateFormatted}\\${LotIndexEle}`)) {
        exec(
            `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_allotment.js ${lotIndexToAllot} ${instanceRunDateFormatted} && pause && pause && exit"`
        );
    }
    sleep(3);
}

try {
    let isFirstRun = true;
    let overwriteLast4Lines = false;
    let lotIndex = LotLastIndex;
    // eslint-disable-next-line no-constant-condition
    while (true) {
        if (getRemainingBookmarksNotDownloadedLength() > 0) {
            overwriteLast4Lines = false;

            /**
             * Read chrome bookmarks from chrome browser
             */
            const allUsernamesBookmarks = getAllUsernamesBookmarks();

            // Create a set of all completed bookmarks to compare for duplicates
            let urlsDownloaded = [];
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
                            urlsDownloaded.push(vehicleBookmarkUrlWOQueryParams);
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
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameBookmark of allUsernamesBookmarks) {
                const dealerLevelBookmarks = usernameBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
                    const usernameTrimmed = usernameBookmark.name.includes('@') ? usernameBookmark.name.split('@')[0] : usernameBookmark.name;
                    const dealerLevelPath = path.join(
                        config.downloadPath,
                        instanceRunDateFormatted,
                        `Lot_${zeroPad(lotIndex, 2)}`,
                        usernameTrimmed,
                        dealerLevelBookmarkName
                    );
                    if (fs.existsSync(dealerLevelPath)) {
                        imagesQtyInLot += getFileCountRecursively(dealerLevelPath);
                        dealerFolderCntInLot++;
                    }
                }
            }

            let page = false;
            let browser = false;
            let userLoggedIn = '';
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameBookmark of allUsernamesBookmarks) {
                lgi(`Reading bookmarks for the Username: `, LineSeparator.false);
                lgi(usernameBookmark.name, Color.cyan, LoggingPrefix.false);
                const credentials = getCredentialsForUsername(usernameBookmark.name);

                setCurrentDealerConfiguration(usernameBookmark.name);
                // const dealerLevelBookmarks = usernameBookmark.children.filter((dealerLevelBookmark) => dealerLevelBookmark.name.includes(' |#| '));
                const dealerLevelBookmarks = usernameBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
                    const { lotCfgMinDealerFolders, lotCfgImagesQty } = getLotConfigPropertiesValues(lotIndex);
                    if (
                        (lotCfgMinDealerFolders === undefined || dealerFolderCntInLot >= lotCfgMinDealerFolders) &&
                        (lotCfgImagesQty === undefined || imagesQtyInLot >= lotCfgImagesQty)
                    ) {
                        if (fs.existsSync(`${config.downloadPath}\\${instanceRunDateFormatted}\\Lot_${zeroPad(lotIndex, 2)}`)) {
                            exec(
                                `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_allotment.js ${lotIndex} ${instanceRunDateFormatted} && pause && pause && exit"`
                            );
                        }
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
                                ({ page, browser } = await initBrowserAndGetPage('download'));
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
                            if (config.updateBookmarksOnceDone && returnObj.bookmarkAppendMesg !== '') {
                                replaceBookmarksElementByGUIDAndWriteToBookmarksFile('name', vehicleBookmark.guid, returnObj.bookmarkAppendMesg);
                            } else {
                                lgu('Bookmark not appended!');
                                if (config.updateBookmarksOnceDone) {
                                    try {
                                        const bookmarksNotAppendFile = path.join(getProjectLogsDirPath(), 'bookmarksNotAppend.txt');
                                        fs.appendFileSync(bookmarksNotAppendFile, `${'-'.repeat(120)}\n`);
                                        fs.appendFileSync(
                                            bookmarksNotAppendFile,
                                            `lotIndex: ${lotIndex}, usernameBookmark.name: ${usernameBookmark.name}, dealerLevelBookmarkName: ${dealerLevelBookmarkName}, \nvehicleBookmark.name: ${vehicleBookmark.name}, \nvehicleBookmark.url: ${vehicleBookmark.url}\n`
                                        );

                                        fs.appendFileSync(bookmarksNotAppendFile, `vehicleBookmark.guid: ${vehicleBookmark.guid}\n`);
                                        fs.appendFileSync(bookmarksNotAppendFile, `returnObj.bookmarkAppendMesg: ${returnObj.bookmarkAppendMesg}\n`);
                                        fs.appendFileSync(bookmarksNotAppendFile, `returnObj: ${beautify(returnObj, null, 3, 120)}\n`);
                                        fs.appendFileSync(bookmarksNotAppendFile, `${'+'.repeat(120)}\n`);
                                    } catch (err) {
                                        lgc(err);
                                    }
                                }
                            }
                            await waitForSeconds(0);
                        }
                    }
                }
            }
            if (typeof browser !== 'boolean') {
                lgi('Waiting for the browser to close, in order to continue.');
                await browser.close();
                lgi('..........Done', LoggingPrefix.false);
            }
        } else {
            // eslint-disable-next-line no-unneeded-ternary
            overwriteLast4Lines = !isFirstRun ? true : false;
        }
        const questionOfKeyInYNToAddMoreBookmarks = 'Do you want to add more bookmarks for today(Y), or do allotment of all the remaining images(N)?';
        const resultOfKeyInYNToAddMoreBookmarks = await keyInYNWithTimeout(questionOfKeyInYNToAddMoreBookmarks, 25000, true);
        if (!resultOfKeyInYNToAddMoreBookmarks) {
            break;
        }
        await waitForSeconds(5);
        await downloadBookmarksFromSourceToProcessing(overwriteLast4Lines);
        isFirstRun = false;
    }

    if (fs.existsSync(`${config.downloadPath}\\${instanceRunDateFormatted}\\Lot_${zeroPad(`lotIndex`, 2)}`)) {
        exec(
            `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_allotment.js ${lotIndex} ${instanceRunDateFormatted} && pause && pause && exit"`
        );
    }
} catch (err) {
    checkBrowserClosed(err);
}
