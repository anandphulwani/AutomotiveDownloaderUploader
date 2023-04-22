import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import date from 'date-and-time';
import { URL } from 'url';
import { getChromeBookmark } from 'chrome-bookmark-reader';

/* eslint-disable import/extensions */
import { config } from './configs/config.js';
import { waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator } from './functions/others.js';
import { gotoURL } from './functions/goto.js';
import { checkTimezone, checkTimeWithNTP } from './functions/time.js';
import { getUniqueIdPairsFromDealerBookmarkName } from './functions/bookmark.js';
import { setCurrentDealerConfiguration } from './functions/excelsupportive.js';
import { validateBookmarkNameText } from './functions/bookmarkvalidation.js';
import { moveFile, getFileCountRecursively, getFolderSizeInBytes } from './functions/filesystem.js';
import { getNumberOfImagesFromAllottedDealerNumberFolder, getUniqueIDFromAllottedDealerNumberFolder } from './functions/datastoresupportive.js';
import { initBrowserAndGetPage, loginCredentials } from './functions/browsersupportive.js';
import { uploadBookmarkURL } from './functions/upload.js';
/* eslint-enable import/extensions */

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
if (false && config.environment === 'production') {
    checkTimezone();
    printSectionSeperator();

    await checkTimeWithNTP();
    printSectionSeperator();
}

const foldersToShift = [];
Object.keys(config.contractors).forEach((contractor) => {
    const contractorReadyToUploadDir = `${config.contractorsZonePath}\\${contractor}\\${todaysDate}\\000_ReadyToUpload`;
    if (fs.existsSync(contractorReadyToUploadDir)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const contractorReadyToUploadSubFolderAndFiles of fs.readdirSync(contractorReadyToUploadDir)) {
            const contractorReadyToUploadSubFolderPath = path.join(contractorReadyToUploadDir, contractorReadyToUploadSubFolderAndFiles);
            const contractorReadyToUploadStat = fs.statSync(contractorReadyToUploadSubFolderPath);

            if (contractorReadyToUploadStat.isDirectory()) {
                // console.log(contractorReadyToUploadSubFolderPath);
                const numberOfImagesAcToFolderName = parseInt(
                    getNumberOfImagesFromAllottedDealerNumberFolder(contractorReadyToUploadSubFolderAndFiles),
                    10
                );
                const numberOfImagesAcToFileCount = getFileCountRecursively(contractorReadyToUploadSubFolderPath);
                // const uniqueId = getUniqueIDFromAllottedDealerNumberFolder(contractorReadyToUploadSubFolderAndFiles);
                if (numberOfImagesAcToFolderName === numberOfImagesAcToFileCount) {
                    const folderSize = getFolderSizeInBytes(contractorReadyToUploadSubFolderPath);
                    // foldersToShift.push([contractorReadyToUploadSubFolderPath, uniqueId, folderSize]);
                    foldersToShift.push([contractorReadyToUploadSubFolderPath, folderSize]);
                }
            }
        }
    }
});
// sleep(15);
// console.log(foldersToShift);
console.log('--------------------------------------------------------------');
// eslint-disable-next-line no-restricted-syntax
for (const folderToShift of foldersToShift) {
    // foldersToShift.forEach(async (folderToShift) => {
    const folderSizeAfter10Seconds = getFolderSizeInBytes(folderToShift[0]);
    if (folderSizeAfter10Seconds !== folderToShift[1]) {
        foldersToShift.splice(folderToShift);
    } else {
        const newUploadingZonePath = `${config.uploadingZonePath}\\${path.basename(folderToShift[0])}`;
        await moveFile(folderToShift[0], newUploadingZonePath);
        folderToShift[0] = newUploadingZonePath;
    }
} // );
// console.log(foldersToShift);

const foldersToUpload = {};
// eslint-disable-next-line no-restricted-syntax
for (const uploadingZoneSubFolderAndFiles of fs.readdirSync(config.uploadingZonePath)) {
    const uploadingZoneSubFolderPath = path.join(config.uploadingZonePath, uploadingZoneSubFolderAndFiles);
    const uploadingZoneStat = fs.statSync(uploadingZoneSubFolderPath);

    if (uploadingZoneStat.isDirectory()) {
        // console.log(uploadingZoneSubFolderPath);
        const uniqueId = getUniqueIDFromAllottedDealerNumberFolder(uploadingZoneSubFolderAndFiles);
        foldersToUpload[uniqueId] = uploadingZoneSubFolderPath;
    }
}
// console.log(foldersToUpload);

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

// if (
//     validateConfigFile() &&
//     // await downloadBookmarksFromSourceToProcessing() &&
//     // eslint-disable-next-line no-bitwise
//     validateDealerConfigurationExcelFile() & validateBookmarksAndCheckCredentialsPresent()
// ) {
//     process.exit(0);
// }

// await killChrome({
//     includingMainProcess: true,
// });

/**
 * Read chrome bookmarks from chrome browser
 */
const { processingBookmarkPathWithoutSync, bookmarkOptions } = config;
const bookmarks = getChromeBookmark(processingBookmarkPathWithoutSync, bookmarkOptions);

// const bookmarksText = fs.readFileSync(processingBookmarkPathWithoutSync);
// let bookmarksJSONObj = JSON.parse(bookmarksText);
// bookmarksJSONObj = removeChecksumFromBookmarksObj(bookmarksJSONObj);

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

// filteredData = filteredData[0].children;

(async () => {
    let page = false;
    let userLoggedIn = '';
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameBookmark of allUsernamesBookmarks) {
        setCurrentDealerConfiguration(usernameBookmark.name);
        const allottedDealerLevelBookmarks = usernameBookmark.children.filter((dealerLevelBookmark) => dealerLevelBookmark.name.includes(' |#| '));
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of allottedDealerLevelBookmarks) {
            console.log(dealerLevelBookmark.name);
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
                    chalk.cyan('Uploading Bookmarks for the Dealer: ') +
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
                        if (typeof page === 'boolean' && !page) {
                            page = await initBrowserAndGetPage();
                        }
                        if (userLoggedIn !== usernameBookmark.name) {
                            const currentURL = await gotoURL(page, vehicleBookmark.url);

                            let parsedCurrentUrl = new URL(currentURL);
                            parsedCurrentUrl = parsedCurrentUrl.host + parsedCurrentUrl.pathname;

                            let parsedVehicleBookmarkURL = new URL(vehicleBookmark.url);
                            parsedVehicleBookmarkURL = parsedVehicleBookmarkURL.host + parsedVehicleBookmarkURL.pathname;

                            if (parsedCurrentUrl !== parsedVehicleBookmarkURL) {
                                await loginCredentials(page, usernameBookmark.name);
                            }
                            userLoggedIn = usernameBookmark.name;
                        }

                        console.log(vehicleBookmark.name);
                        const returnObj = await uploadBookmarkURL(
                            page,
                            uniqueIdElement,
                            foldersToUpload[uniqueIdElement],
                            dealerLevelBookmarkName,
                            vehicleBookmark.name,
                            vehicleBookmark.url
                        );
                    }
                }
                // } else {
                //     // eslint-disable-next-line no-continue
                //     continue;
                // }
            }
        }
        process.exit(0);
        const usernameLevelBookmark = usernameBookmark;

        const dealerLevelBookmarks = usernameLevelBookmark.children;
        // eslint-disable-next-line no-restricted-syntax
        for (const dealerLevelBookmark of dealerLevelBookmarks) {
            const dealerLevelBookmarkName = validateBookmarkNameText(dealerLevelBookmark.name, usernameLevelBookmark.name);
            console.log(
                chalk.cyan('Reading Bookmarks for the Dealer: ') +
                    chalk.cyan.bold(dealerLevelBookmarkName) +
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
                // if (config.updateBookmarksOnceDone && returnObj.bookmarkAppendMesg !== '') {
                //     bookmarksJSONObj = await replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(
                //         bookmarkPath,
                //         bookmarksJSONObj,
                //         vehicleBookmark.guid,
                //         returnObj.bookmarkAppendMesg
                //     );
                // }
                await waitForSeconds(0);
            }
            // const usernameTrimmed = usernameLevelBookmark.name.includes('@')
            //     ? usernameLevelBookmark.name.split('@')[0]
            //     : usernameLevelBookmark.name;
            // const dealerLevelPath = `${config.downloadPath}\\${todaysDate}\\Lot_${zeroPad(
            //     lotIndex,
            //     2
            // )}\\${usernameTrimmed}\\${dealerLevelBookmarkName}`;
            // if (fs.existsSync(dealerLevelPath)) {
            //     // console.log(`exists dealerLevelPath: ${dealerLevelPath}`);
            //     // console.log(`getFileCountRecursively(dealerLevelPath).length: ${getFileCountRecursively(dealerLevelPath)}`);
            //     imagesQtyInLot += getFileCountRecursively(dealerLevelPath);
            //     dealerFolderCntInLot++;
            // }
        }
    }
    // await browser.close();
})();
// await sleep(10000);
// process.exit(0);
