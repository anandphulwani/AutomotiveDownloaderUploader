import chalk from 'chalk';
import fs from 'fs';
import date from 'date-and-time';
import killChrome from 'kill-chrome';
import puppeteer from 'puppeteer';
import { exec, spawn } from 'child_process';
import { getChromeBookmark } from 'chrome-bookmark-reader';
import { keyInYN } from 'readline-sync';
import { URL as URLparser } from 'url';

/* eslint-disable import/extensions */
import { config } from './configs/config.js';
import { getCredentialsForUsername, getAppDomain } from './functions/configsupportive.js';
import { zeroPad } from './functions/stringformatting.js';
import { msleep, sleep, waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import { checkTimezone, checkTimeWithNTP } from './functions/time.js';
import { fillInTextbox, clickOnButton } from './functions/actionOnElements.js';
import { waitForElementContainsOrEqualsText, waitForElementContainsOrEqualsHTML, waitTillCurrentURLStartsWith } from './functions/waiting.js';
import { initBrowserAndGetPage, loginCredentials, getCurrentUser } from './functions/browsersupportive.js';
import { gotoURL, gotoPageAndWaitTillCurrentURLStartsWith } from './functions/goto.js';
import {
    downloadBookmarksFromSourceToProcessing,
    handleBookmarkURL,
    removeChecksumFromBookmarksObj,
    replaceBookmarksNameOnGUIDAndWriteToBookmarksFile,
} from './functions/bookmark.js';
import { setCurrentDealerConfiguration } from './functions/excelsupportive.js';
import { validateDealerConfigurationExcelFile } from './functions/excelvalidation.js';
import { validateBookmarksAndCheckCredentialsPresent, validateBookmarkNameText } from './functions/bookmarkvalidation.js';
import { validateConfigFile } from './functions/configvalidation.js';
import { getFileCountRecursively, getListOfSubfoldersStartingWith } from './functions/filesystem.js';
/* eslint-enable import/extensions */

// const {
//     db: { host, port, name },
// } = config;
// console.log(`${host}:${port}/${name}`);
// console.log(config);

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
if (config.environment === 'production') {
    checkTimezone();
    printSectionSeperator();

    await checkTimeWithNTP();
    printSectionSeperator();
}

// ONPROJECTFINISH: Remove the unused imports
// NORMALPRIORITY: Error summary in the end.
// TODO: Delete repeated bookmark in the same dealer folder
// TODO: disallow same dealerNumber folders in a username folder, and same username folder in bookmark bar
// ONPROJECTFINISH:  resultCheck is declared outside, work out how to bring it inside the function
// ONPROJECTFINISH:  Decide whether to use bookmarkPath or bookmarksPath (with s in variable) and replace all bookmarks variable accordingly
// ONPROJECTFINISH: Check 'await page.waitForFunction' as it might create problems, removed from everywhere, just search it once again to verify.

// Non-shortcircuiting and: [f1(), f2()].every(i => i)
// Non-shortcircuiting or: [f1(), f2()].some(i => i)

if (
    !(
        true && // validateConfigFile()
        true && // await downloadBookmarksFromSourceToProcessing()
        // // TODO: validateBookmarksAndCheckCredentialsPresent() => Dealer Name space in the middle gives validation error which it shoudl not
        [validateDealerConfigurationExcelFile() !== 'error', validateBookmarksAndCheckCredentialsPresent() !== 'error'].every((i) => i)
    )
) {
    console.log(chalk.white.bgRed.bold(`Please correct the above errors, in order to continue.`));
    process.exit(1);
}

// await killChrome({
//     includingMainProcess: true,
// });

const LotIndexArray = getListOfSubfoldersStartingWith(`${config.downloadPath}\\${todaysDate}`, 'Lot_');
let LotLastIndex = LotIndexArray.length > 0 ? parseInt(LotIndexArray[LotIndexArray.length - 1].substring(4), 10) : null;
if (LotLastIndex === null) {
    if (config.lotLastRunDate === todaysDate) {
        LotLastIndex = parseInt(config.lotLastRunNumber.substring(4), 10) + 1;
    } else {
        LotLastIndex = 1;
    }
}
LotIndexArray.pop();

// eslint-disable-next-line no-restricted-syntax
for (const LotIndexEle of LotIndexArray) {
    const lotIndexToAllot = parseInt(LotIndexEle.substring(4), 10);
    if (fs.existsSync(`${config.downloadPath}\\${todaysDate}\\${LotIndexEle}`)) {
        exec(
            `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_alltoment.js ${lotIndexToAllot} ${todaysDate} && pause && pause && exit"`
        );
    }
    sleep(3);
}

/**
 * Read chrome bookmarks from chrome browser
 */
const { processingBookmarkPathWithoutSync, bookmarkOptions } = config;
const bookmarks = getChromeBookmark(processingBookmarkPathWithoutSync, bookmarkOptions);

const bookmarksBarData = bookmarks.filter((topLevelBookmark) => topLevelBookmark.name === 'Bookmarks bar');
if (!bookmarksBarData.length > 0) {
    console.log(chalk.white.bgRed.bold(`Bookmarks section doesn't contain bookmarks bar.`));
    process.exit(1);
}
const bookmarksBarDataChildren = bookmarksBarData[0].children;

const allUsernamesFromConfig = config.credentials.map((item) => item.username);
const allUsernamesBookmarks = bookmarksBarDataChildren.filter((usernameLevelBookmark) => allUsernamesFromConfig.includes(usernameLevelBookmark.name));
if (!allUsernamesBookmarks.length > 0) {
    console.log(chalk.white.bgRed.bold(`Bookmarks bar doesn't contain folders of the usernames available in the config.`));
    process.exit(1);
}

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

// try{
(async () => {
    let lotIndex = LotLastIndex;
    let dealerFolderCntInLot = 0;
    let imagesQtyInLot = 0;

    let page = false;
    let browser = false;
    let userLoggedIn = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        console.log(chalk.cyan(`Reading bookmarks for the Username: ${chalk.cyan.bold(usernameBookmark.name)}`));
        const credentials = getCredentialsForUsername(usernameBookmark.name);

        setCurrentDealerConfiguration(usernameBookmark.name);
        // const dealerLevelBookmarks = usernameBookmark.children.filter((dealerLevelBookmark) => dealerLevelBookmark.name.includes(' |#| '));
        const dealerLevelBookmarks = usernameBookmark.children;
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of dealerLevelBookmarks) {
            const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameBookmark.name);
            const minDealerFolders = config.lot[lotIndex - 1].minimumDealerFoldersForEachContractors * Object.keys(config.contractors).length;
            if (
                (minDealerFolders === false || dealerFolderCntInLot >= minDealerFolders) &&
                (config.lot[lotIndex - 1].imagesQty === 0 || imagesQtyInLot >= config.lot[lotIndex - 1].imagesQty)
            ) {
                if (fs.existsSync(`${config.downloadPath}\\${todaysDate}\\Lot_${zeroPad(lotIndex, 2)}`)) {
                    exec(
                        `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_alltoment.js ${lotIndex} ${todaysDate} && pause && pause && exit"`
                    );
                }
                dealerFolderCntInLot = 0;
                imagesQtyInLot = 0;
                lotIndex++;
            }
            console.log(
                chalk.cyan('Reading bookmarks for the Dealer: ') +
                    chalk.cyan.bold(dealerLevelBookmarkName) +
                    chalk.cyan(' from the Username: ') +
                    chalk.cyan.bold(usernameBookmark.name)
            );
            const vehicleBookmarks = dealerLevelBookmark.children;

            // eslint-disable-next-line no-restricted-syntax
            for (const vehicleBookmark of vehicleBookmarks) {
                if (!vehicleBookmark.name.includes(' |#| ')) {
                    if (typeof page === 'boolean' && !page) {
                        ({ page, browser } = await initBrowserAndGetPage('download'));
                        // Create raw protocol session.
                        const session = await page.target().createCDPSession();
                        const { windowId } = await session.send('Browser.getWindowForTarget');
                        await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });
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
                        await replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(vehicleBookmark.guid, returnObj.bookmarkAppendMesg);
                    } else {
                        console.log('Bookmark not appended!');
                        try {
                            // TODO: Check this
                            fs.appendFileSync(
                                './logs/test.txt',
                                '--------------------------------------------------------------------------------------------------'
                            );
                            fs.appendFileSync(
                                './logs/test.txt',
                                `lotIndex: ${lotIndex}, usernameBookmark.name: ${usernameBookmark.name}, dealerLevelBookmarkName: ${dealerLevelBookmarkName}, vehicleBookmark.name: ${vehicleBookmark.name}, vehicleBookmark.url: ${vehicleBookmark.url}`
                            );

                            fs.appendFileSync('./logs/test.txt', `vehicleBookmark.guid: ${vehicleBookmark.guid}`);
                            fs.appendFileSync('./logs/test.txt', `returnObj: ${returnObj}`);
                            fs.appendFileSync(
                                './logs/test.txt',
                                '+++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++'
                            );
                        } catch (err) {
                            console.error(err);
                        }
                    }
                    await waitForSeconds(0);
                }
            }
            const usernameTrimmed = usernameBookmark.name.includes('@') ? usernameBookmark.name.split('@')[0] : usernameBookmark.name;
            const dealerLevelPath = `${config.downloadPath}\\${todaysDate}\\Lot_${zeroPad(
                lotIndex,
                2
            )}\\${usernameTrimmed}\\${dealerLevelBookmarkName}`;
            if (fs.existsSync(dealerLevelPath)) {
                imagesQtyInLot += getFileCountRecursively(dealerLevelPath);
                dealerFolderCntInLot++;
            }
        }
    }
    if (fs.existsSync(`${config.downloadPath}\\${todaysDate}\\Lot_${zeroPad(lotIndex, 2)}`)) {
        if (!keyInYN('Do you want to add more bookmarks for today(Y), or do allotment of all the remaining images(N)?')) {
            exec(
                `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_alltoment.js ${lotIndex} ${todaysDate} && pause && pause && exit"`
            );
        }
    }
    if (typeof browser !== 'boolean') {
        await browser.close();
    }
})();
// TODO: Enable this error catching, and copy it in the uploading section as well
// } catch (error)
// {
//     Protocol error (Page.navigate): Session closed. Most likely the page has been closed.
// }
