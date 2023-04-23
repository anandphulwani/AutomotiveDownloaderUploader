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

await downloadBookmarksFromSourceToProcessing();

// TODO: Remove the unused imports
// TODO: Error summary in the end.
// TODO: resultCheck is declared outside, work out how to bring it inside the function
// TODO: Decide whether to use bookmarkPath or bookmarksPath (with s in variable) and replace all bookmarks variable accordingly

// const resultOfValidateDealerConfigurationExcelFile = validateDealerConfigurationExcelFile();
// // TODO: Dealer Name space in the middle gives validation error which it shoudl not
// const resultOfValidateBookmarksAndCheckCredentialsPresent = validateBookmarksAndCheckCredentialsPresent();
// const resultOfValidateConfigFile = 'success'; // validateConfigFile();
// if (
//     resultOfValidateDealerConfigurationExcelFile === 'error' ||
//     resultOfValidateBookmarksAndCheckCredentialsPresent === 'error' ||
//     resultOfValidateConfigFile === 'error'
// ) {
//     process.exit(0);
// }

if (
    validateConfigFile() &&
    (await downloadBookmarksFromSourceToProcessing()) &&
    // eslint-disable-next-line no-bitwise
    validateDealerConfigurationExcelFile() & validateBookmarksAndCheckCredentialsPresent()
) {
    process.exit(0);
}

// await killChrome({
//     includingMainProcess: true,
// });

/**
 * Read chrome bookmarks from chrome browser
 */

const { processingBookmarkPathWithoutSync, bookmarkOptions } = config;
const bookmarks = getChromeBookmark(processingBookmarkPathWithoutSync, bookmarkOptions);
const bookmarksText = fs.readFileSync(processingBookmarkPathWithoutSync);
let bookmarksJSONObj = JSON.parse(bookmarksText);
bookmarksJSONObj = removeChecksumFromBookmarksObj(bookmarksJSONObj);

(async () => {
    const { page, browser } = await initBrowserAndGetPage('download');
    // Create raw protocol session.
    const session = await page.target().createCDPSession();
    const { windowId } = await session.send('Browser.getWindowForTarget');
    await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });

    const LotIndexArray = getListOfSubfoldersStartingWith(`${config.downloadPath}\\${todaysDate}`, 'Lot_');
    let LotLastIndex = LotIndexArray.length > 0 ? parseInt(LotIndexArray[LotIndexArray.length - 1].substring(4), 10) : null;
    if (LotLastIndex === null && config.lotLastRunDate === todaysDate) {
        LotLastIndex = parseInt(config.lotLastRunNumber.substring(4), 10) + 1;
    } else {
        LotLastIndex = 1;
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

    // Create a set of all completed bookmarks to compare for duplicates
    let urlsDownloaded = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const topLevelBookmark of bookmarks) {
        if (topLevelBookmark.name === 'Bookmarks bar') {
            const usernameLevelBookmarks = topLevelBookmark.children;
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameLevelBookmark of usernameLevelBookmarks) {
                const dealerLevelBookmarks = usernameLevelBookmark.children;
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
        }
    }

    let lotIndex = LotLastIndex;
    let dealerFolderCntInLot = 0;
    let imagesQtyInLot = 0;
    // eslint-disable-next-line no-restricted-syntax
    for (const topLevelBookmark of bookmarks) {
        if (topLevelBookmark.name === 'Bookmarks bar') {
            console.log(chalk.cyan('Reading Bookmarks bar from the bookmarks data.'));
            const usernameLevelBookmarks = topLevelBookmark.children;
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameLevelBookmark of usernameLevelBookmarks) {
                /* #region Login details */
                console.log(chalk.cyan(`Reading Bookmarks for the Username: ${chalk.cyan.bold(usernameLevelBookmark.name)}`));
                const credentials = getCredentialsForUsername(usernameLevelBookmark.name);
                if (credentials === undefined) {
                    console.log(
                        chalk.white.bgYellow.bold(
                            `WARNING: Credentials for ${usernameLevelBookmark.name} not found in config file, Please declare in config.`
                        )
                    );
                    // eslint-disable-next-line no-continue
                    continue;
                }
                await loginCredentials(page, credentials);

                setCurrentDealerConfiguration(usernameLevelBookmark.name);
                const dealerLevelBookmarks = usernameLevelBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameLevelBookmark.name);

                    const minDealerFolders = config.lot[lotIndex - 1].minimumDealerFoldersForEachContractors * Object.keys(config.contractors).length;
                    // console.log(`minDealerFolders: ${minDealerFolders}`);
                    // console.log(`dealerFolderCntInLot: ${dealerFolderCntInLot}`);
                    // console.log(`config.lot[lotIndex - 1].imagesQty: ${config.lot[lotIndex - 1].imagesQty}`);
                    // console.log(`imagesQtyInLot: ${imagesQtyInLot}`);
                    if (
                        ((minDealerFolders !== false && dealerFolderCntInLot >= minDealerFolders) || minDealerFolders === false) &&
                        imagesQtyInLot >= config.lot[lotIndex - 1].imagesQty
                    ) {
                        if (fs.existsSync(`${config.downloadPath}\\${todaysDate}\\Lot_${zeroPad(lotIndex, 2)}`)) {
                            exec(
                                `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_alltoment.js ${lotIndex} ${todaysDate} && pause && pause && exit"`
                            );
                        }
                        // console.log('Resetting vars to 0.');
                        dealerFolderCntInLot = 0;
                        imagesQtyInLot = 0;
                        lotIndex++;
                    }
                    console.log(
                        chalk.cyan('Reading Bookmarks for the Dealer: ') +
                            chalk.cyan.bold(dealerLevelBookmarkName) +
                            chalk.cyan(' from the Username: ') +
                            chalk.cyan.bold(usernameLevelBookmark.name)
                    );
                    const vehicleBookmarks = dealerLevelBookmark.children;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const vehicleBookmark of vehicleBookmarks) {
                        const returnObj = await handleBookmarkURL(
                            page,
                            lotIndex,
                            usernameLevelBookmark.name,
                            dealerLevelBookmarkName,
                            vehicleBookmark.name,
                            vehicleBookmark.url,
                            urlsDownloaded
                        );
                        urlsDownloaded = returnObj.urlsDownloaded;
                        if (config.updateBookmarksOnceDone && returnObj.bookmarkAppendMesg !== '') {
                            bookmarksJSONObj = await replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(
                                processingBookmarkPathWithoutSync,
                                bookmarksJSONObj,
                                vehicleBookmark.guid,
                                returnObj.bookmarkAppendMesg
                            );
                        }
                        await waitForSeconds(0);
                    }
                    const usernameTrimmed = usernameLevelBookmark.name.includes('@')
                        ? usernameLevelBookmark.name.split('@')[0]
                        : usernameLevelBookmark.name;
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
        }
    }
    if (fs.existsSync(`${config.downloadPath}\\${todaysDate}\\Lot_${zeroPad(lotIndex, 2)}`)) {
        if (!keyInYN('Do you want to add more bookmarks for today(Y), or do allotment of all the remaining images(N)?')) {
        exec(
            `start cmd.exe /K "@echo off && cd /D ${process.cwd()} && cls && node contractors_alltoment.js ${lotIndex} ${todaysDate} && pause && pause && exit"`
        );
        }
    }
    await browser.close();
})();
