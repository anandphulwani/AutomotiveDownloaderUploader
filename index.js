import puppeteer from 'puppeteer';
import https from 'https';
import crypto from 'crypto';
import { NtpTimeSync } from 'ntp-time-sync';
import { getChromeBookmark } from 'chrome-bookmark-reader';
import pos from 'get-cursor-position';

import { printSectionSeperator } from './functions/others';
import { msleep, sleep, waitForSeconds } from './functions/sleep';
import { zeroPad } from './functions/padding';
import {
    makeDir,
    moveFile,
    createDirAndMoveFile,
    removeDir,
    createDirAndMoveFileFromTempDirToDestination,
    generateTempFolderWithRandomText,
} from './functions/filesystem';
import { getRowPosOnTerminal } from './functions/terminal';
import { fillInTextbox, clickOnButton } from './functions/actionOnElements';
import { waitForElementContainsText, waitForElementContainsHTML, waitTillCurrentURLStartsWith } from './functions/waiting';
import { gotoURL, gotoPageAndWaitTillCurrentURLStartsWith } from './functions/goto';
import { getChecksumFromURL, downloadFileAndCompareWithChecksum } from './functions/download';
import { handleBookmarkURL } from './functions/bookmark';
import { getImagesFromContent } from './functions/pageextraction';
import { readDealerConfiguration } from './functions/excel';
import { getImageNumbersToDownloadFromDC } from './functions/excelsupportive';

// /**
//  * Check if timezone matches of Asia/Calcutta
//  */
// console.log(chalk.cyan("Check if timezone matches of Asia/Calcutta: Executing."));
// if (Intl.DateTimeFormat().resolvedOptions().timeZone != "Asia/Calcutta") {
//     console.log(chalk.white.bgRed.bold("System timezone is not set to India: Asia/Calcutta UTC+5.30 Hours"));
//     process.exit(1);
// } else {
//     console.log(chalk.green.bold("System timezone matches to India: Asia/Calcutta UTC+5.30 Hours"));
// }
// console.log(chalk.cyan("Check if timezone matches of Asia/Calcutta: Done."));
// printSectionSeperator();

// /**
//  * Check if time is in sync with online NTP servers.
//  */
// console.log(chalk.cyan("Check if time is in sync with online NTP servers.: Executing."));
// const timeSync = NtpTimeSync.getInstance();
// await timeSync.getTime().then(function (result) {
//   console.log(chalk.cyan("Current System time: "+ new Date() +",\nReal time (NTP Servers): "+result.now));
//   const offsetInSeconds = Math.abs( Math.round( result.offset / 1000 ) );
//   if ( offsetInSeconds > (2 * 60 ) ) {
//     console.log(chalk.white.bgRed.bold("System time not set accurately, time is off by "+ offsetInSeconds +" seconds ("+result.offset+"ms), \nPlease re sync time with NTP server."));
//     process.exit(1);
//   } else {
//     console.log(chalk.green.bold("System time shows accurate data i.e. (within 2 mins differnce), current offset is "+ offsetInSeconds +" seconds ("+result.offset+"ms)."));
//   }
// })
// console.log(chalk.cyan("Check if time is in sync with online NTP servers.: Done."));
// printSectionSeperator();

/**
 * Read chrome bookmarks from chrome browser
 */
// const bookmarkPath = '/path/to/Chrome/Bookmark' OR '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\Bookmarks' //TODO: Change path to default and pick from ini
const bookmarkPath = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks';
const option = {
    shouldIncludeFolders: true,
};
const bookmarks = getChromeBookmark(bookmarkPath, option);

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data'],
    });
    const [page] = await browser.pages();

    // bookmarks.forEach(async (topLevelBookmark) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const topLevelBookmark of bookmarks) {
        if (topLevelBookmark.name === 'Bookmarks bar') {
            console.log(chalk.cyan('Reading Bookmarks bar from the bookmarks data.'));
            const usernameLevelBookmarks = topLevelBookmark.children;
            // usernameLevelBookmarks.forEach(async (usernameLevelBookmark) => {
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameLevelBookmark of usernameLevelBookmarks) {
                console.log(chalk.cyan(`Reading Bookmarks for the Username: ${chalk.cyan.bold(usernameLevelBookmark.name)}`));

                await gotoPageAndWaitTillCurrentURLStartsWith(
                    page,
                    'https://signin.coxautoinc.com/logout?bridge_solution=HME',
                    'https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId='
                ); // use  (..., undefined, true) as params
                const username = 'dinesharora80@gmail.com';
                const password = 'kunsh123';
                await fillInTextbox(page, '#username', username);
                await clickOnButton(page, '#signIn', 'Next');
                await waitForElementContainsText(page, '#returnLink', `← ${username}`);
                await fillInTextbox(page, '#password', password);
                await clickOnButton(page, '#signIn', 'Sign in');
                await waitTillCurrentURLStartsWith(page, 'https://www.homenetiol.com/dashboard');
                await waitForElementContainsText(page, '.bb-logout', 'Sign out');
                // eslint-disable-next-line no-undef, no-loop-func
                await page.waitForFunction((args) => document.querySelector(args[0]).value.toLowerCase() === args[1].toLowerCase(), {}, [
                    'dt.bb-userdatum__value',
                    username,
                ]);
                await waitForSeconds(10);

                const dealerLevelBookmarks = usernameLevelBookmark.children;
                // dealerLevelBookmarks.forEach(async (dealerLevelBookmark) => {
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    console.log(
                        chalk.cyan('Reading Bookmarks for the Dealer: ') +
                            chalk.cyan.bold(dealerLevelBookmark.name) +
                            chalk.cyan(' from the Username: ') +
                            chalk.cyan.bold(usernameLevelBookmark.name)
                    );
                    const vehicleBookmarks = dealerLevelBookmark.children;
                    // vehicleBookmarks.forEach(async (vehicleBookmark) => {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const vehicleBookmark of vehicleBookmarks) {
                        await handleBookmarkURL(page, dealerLevelBookmark.name, vehicleBookmark.name, vehicleBookmark.url);
                        await waitForSeconds(0);
                    } // });
                } // });
            } // });
        }
    } // });
    await browser.close();
})();
// await sleep(10000);
// process.exit(0);
