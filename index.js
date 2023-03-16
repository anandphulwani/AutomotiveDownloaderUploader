import chalk from 'chalk';
import fs from 'fs';
import killChrome from 'kill-chrome';
import puppeteer from 'puppeteer';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from './configs/config.js';
import { getCredentialsForUsername, getAppDomain } from './functions/configsupportive.js';
import { msleep, sleep, waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import { checkTimezone, checkTimeWithNTP } from './functions/time.js';
import { fillInTextbox, clickOnButton } from './functions/actionOnElements.js';
import { waitForElementContainsText, waitForElementContainsHTML, waitTillCurrentURLStartsWith } from './functions/waiting.js';
import { gotoURL, gotoPageAndWaitTillCurrentURLStartsWith } from './functions/goto.js';
import { handleBookmarkURL, removeChecksumFromBookmarksObj, replaceBookmarksNameOnGUIDAndWriteToBookmarksFile } from './functions/bookmark.js';
import { validateDealerConfigurationExcelFile } from './functions/excelvalidation.js';
import { readDealerConfigurationFormatted, readDealerConfigurationExcel } from './functions/excel.js';
import { validateBookmarksAndCheckCredentialsPresent } from './functions/bookmarkvalidation.js';
import { validateConfigFile } from './functions/configvalidation.js';
/* eslint-enable import/extensions */

// const {
//     db: { host, port, name },
// } = config;
// console.log(`${host}:${port}/${name}`);
// console.log(config);

if (config.environment === 'production') {
    checkTimezone();
    printSectionSeperator();

    await checkTimeWithNTP();
    printSectionSeperator();
}

// TODO: Remove the unused imports
// TODO: Remove specificDebug messages
// TODO: resultCheck is declared outside, work out how to bring it inside the function
// TODO: Decide whether to use bookmarkPath or bookmarksPath (with s in variable) and replace all bookmarks variable accordingly
// const resultOfValidateDealerConfigurationExcelFile = validateDealerConfigurationExcelFile();
// const resultOfValidateBookmarksAndCheckCredentialsPresent = validateBookmarksAndCheckCredentialsPresent();
// const resultOfValidateConfigFile = validateConfigFile();
// if (
//     resultOfValidateDealerConfigurationExcelFile === 'error' ||
//     resultOfValidateBookmarksAndCheckCredentialsPresent === 'error' ||
//     resultOfValidateConfigFile === 'error'
// ) {
//     process.exit(0);
// }

// await killChrome({
//     includingMainProcess: true,
// });

/**
 * Read chrome bookmarks from chrome browser
 */

const { bookmarkPath, bookmarkOptions } = config;
const bookmarks = getChromeBookmark(bookmarkPath, bookmarkOptions);
const bookmarksText = fs.readFileSync(bookmarkPath);
let bookmarksJSONObj = JSON.parse(bookmarksText);
bookmarksJSONObj = removeChecksumFromBookmarksObj(bookmarksJSONObj);

(async () => {
    const browser = await puppeteer.launch(config.browserArgs);
    const numberOfOpenPages = (await browser.pages()).length;
    if (numberOfOpenPages > 1) {
        console.log(chalk.white.bgRed.bold(`\nGoogle Chrome has older multiple tabs opened, Change google chrome settings:`));
        console.log(chalk.white.bgRed.bold(`        01. Open "chrome://settings/" URL in Google Chrome.`));
        console.log(chalk.white.bgRed.bold(`        02. Search "On startup" in the search bar.`));
        console.log(chalk.white.bgRed.bold(`        03. Select "Open the New Tab page" in the options.`));
        console.log(chalk.white.bgRed.bold(`        04. Close the browser.`));
        process.exit(1);
    }
    const [page] = await browser.pages();
    // Create raw protocol session. // TODO: Check why minimized makes program hanging.
    // const session = await page.target().createCDPSession();
    // const { windowId } = await session.send('Browser.getWindowForTarget');
    // await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });

    let lotIndex = 1;
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

                await gotoPageAndWaitTillCurrentURLStartsWith(
                    page,
                    'https://signin.coxautoinc.com/logout?bridge_solution=HME',
                    'https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId='
                ); // use  (..., undefined, true) as params
                await fillInTextbox(page, '#username', credentials.username);
                await clickOnButton(page, '#signIn', 'Next');
                // console.log('001');
                await waitForElementContainsText(page, '#returnLink', `← ${credentials.username}`, true);
                // console.log('002');
                await fillInTextbox(page, '#password', credentials.password);
                await clickOnButton(page, '#signIn', 'Sign in');
                // console.log('003');
                await waitTillCurrentURLStartsWith(page, `${getAppDomain()}/dashboard`);
                // console.log('004');
                await page.waitForSelector('#bridge-bar-user-menu', { timeout: 90000 });
                // console.log('005');
                await page.waitForSelector('.bb-logout', { timeout: 90000 });
                // console.log('006');

                // TODO: Enable the below block
                // eslint-disable-next-line no-undef, no-loop-func
                // await page.waitForFunction((args) => document.querySelector(args[0]).innerHTML.toLowerCase() === args[1].toLowerCase(), { timeout: 90000 }, [
                //     'dt.bb-userdatum__value',
                //     credentials.username,
                // ]);
                // console.log('007');
                // await waitForSeconds(5, true);
                /* #endregion */

                const dealerLevelBookmarks = usernameLevelBookmark.children;
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    const minDealerFoldersForEachContractors =
                        config.lot[lotIndex - 1].minimumDealerFoldersForEachContractors * Object.keys(config.contractors).length;
                    console.log(`minDealerFoldersForEachContractors: ${minDealerFoldersForEachContractors}`);
                    console.log(`dealerFolderCntInLot: ${dealerFolderCntInLot}`);
                    console.log(`config.lot[lotIndex - 1].imagesQty: ${config.lot[lotIndex - 1].imagesQty}`);
                    console.log(`imagesQtyInLot: ${imagesQtyInLot}`);
                    if (
                        ((minDealerFoldersForEachContractors !== false && dealerFolderCntInLot >= minDealerFoldersForEachContractors) ||
                            minDealerFoldersForEachContractors === false) &&
                        imagesQtyInLot >= config.lot[lotIndex - 1].imagesQty
                    ) {
                        console.log('Reseting vars to 0.');
                        dealerFolderCntInLot = 0;
                        imagesQtyInLot = 0;
                        lotIndex++;
                    }
                    console.log(
                        chalk.cyan('Reading Bookmarks for the Dealer: ') +
                            chalk.cyan.bold(dealerLevelBookmark.name) +
                            chalk.cyan(' from the Username: ') +
                            chalk.cyan.bold(usernameLevelBookmark.name)
                    );
                    const vehicleBookmarks = dealerLevelBookmark.children;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const vehicleBookmark of vehicleBookmarks) {
                        if (vehicleBookmark.name.includes('|#|')) {
                            // eslint-disable-next-line no-continue
                            continue;
                        }
                        const returnObj = await handleBookmarkURL(
                            page,
                            lotIndex,
                            usernameLevelBookmark.name,
                            dealerLevelBookmark.name,
                            vehicleBookmark.name,
                            vehicleBookmark.url
                        );
                        // return { result: true, bookmarkAppendMesg: stockNumber, imagesDownloaded: imagesDownloaded };
                        // return { result: false, bookmarkAppendMesg: '', imagesDownloaded: 0 };
                        // return { result: false, bookmarkAppendMesg: ignoreBookmarkURLObjectFindResults.ignoreMesgInBookmark, imagesDownloaded: 0 };
                        // return { result: false, bookmarkAppendMesg: 'Ignoring (Does not Exist)', imagesDownloaded: 0 };
                        //
                        imagesQtyInLot += returnObj.imagesDownloaded;
                        if (config.updateBookmarksOnceDone && returnObj.bookmarkAppendMesg !== '') {
                            bookmarksJSONObj = replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(
                                bookmarkPath,
                                bookmarksJSONObj,
                                vehicleBookmark.guid,
                                returnObj.bookmarkAppendMesg
                            );
                        }
                        await waitForSeconds(0);
                    }
                    dealerFolderCntInLot++;
                }
            }
        }
    }
    await browser.close();
})();
// await sleep(10000);
// process.exit(0);
