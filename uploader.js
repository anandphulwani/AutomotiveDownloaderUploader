import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import date from 'date-and-time';
import { URL } from 'url';

/* eslint-disable import/extensions */
import { config } from './configs/config.js';
import { lgw, lge } from './functions/loggersupportive.js';
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
import { validateConfigFile } from './functions/configvalidation.js';
import {
    createDirAndMoveFile,
    getFileCountNonRecursively,
    getFileCountRecursively,
    getFolderSizeInBytes,
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty,
} from './functions/filesystem.js';
import {
    autoCleanUpDatastoreZones,
    getUploadRemainingSummary,
    getNumberOfImagesFromAllottedDealerNumberFolder,
    getUniqueIDFromAllottedDealerNumberFolder,
} from './functions/datastoresupportive.js';
import { initBrowserAndGetPage, loginCredentials, getCurrentUser } from './functions/browsersupportive.js';
import { uploadBookmarkURL } from './functions/upload.js';
/* eslint-enable import/extensions */

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
if (config.environment === 'production') {
    checkTimezone();
    printSectionSeperator();

    await checkTimeWithNTP();
    printSectionSeperator();
}
autoCleanUpDatastoreZones();

const foldersToShift = [];
Object.keys(config.contractors).forEach((contractor) => {
    const contractorReadyToUploadDir = `${config.contractorsZonePath}\\${contractor}\\${todaysDate}\\000_ReadyToUpload`;
    if (fs.existsSync(contractorReadyToUploadDir)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const contractorReadyToUploadSubFolderAndFiles of fs.readdirSync(contractorReadyToUploadDir)) {
            const contractorReadyToUploadSubFolderPath = path.join(contractorReadyToUploadDir, contractorReadyToUploadSubFolderAndFiles);
            const contractorReadyToUploadStat = fs.statSync(contractorReadyToUploadSubFolderPath);

            if (contractorReadyToUploadStat.isDirectory()) {
                if (/^.* (([^\s]* )*)[^\s]+ \d{1,3} \(#\d{5}\)$/.test(contractorReadyToUploadSubFolderAndFiles)) {
                    const numberOfImagesAcToFolderName = parseInt(
                        getNumberOfImagesFromAllottedDealerNumberFolder(contractorReadyToUploadSubFolderAndFiles),
                        10
                    );
                    const numberOfImagesAcToFileCount = getFileCountRecursively(contractorReadyToUploadSubFolderPath);
                    if (numberOfImagesAcToFolderName === numberOfImagesAcToFileCount) {
                        const folderSize = getFolderSizeInBytes(contractorReadyToUploadSubFolderPath);
                        foldersToShift.push([contractorReadyToUploadSubFolderPath, folderSize]);
                    } else {
                        lgw(
                            `Folder in ReadyToUpload but images quantity does not match, Folder: ${contractor}\\000_ReadyToUpload\\${contractorReadyToUploadSubFolderAndFiles}, Images Qty ac to folder name: ${numberOfImagesAcToFolderName} and  Images Qty present in the folder: ${numberOfImagesAcToFileCount}, Ignoring.`
                        );
                    }
                } else {
                    lgw(
                        `Folder in ReadyToUpload but is not in a proper format, Folder: ${contractor}\\000_ReadyToUpload\\${contractorReadyToUploadSubFolderAndFiles}, Ignoring.`
                    );
                }
            }
        }
    }
});
// sleep(15);
// console.log(foldersToShift);

async function moveFilesFromContractorsToUploadingZone(isDryRun = true) {
    let doesDestinationFolderAlreadyExists = false;
    let hasMovingToUploadZonePrinted = false;
    const foldersToShiftLength = foldersToShift.length;
    for (let cnt = 0; cnt < foldersToShiftLength; cnt++) {
        const folderToShift = foldersToShift[cnt];
        const folderSizeAfter10Seconds = getFolderSizeInBytes(folderToShift[0]);
        if (folderSizeAfter10Seconds !== folderToShift[1]) {
            foldersToShift.splice(folderToShift);
        } else {
            if (!isDryRun && !hasMovingToUploadZonePrinted) {
                process.stdout.write(chalk.cyan('Moving folders to UploadingZone: '));
                hasMovingToUploadZonePrinted = true;
            }
            process.stdout.write(chalk.cyan(`${path.basename(folderToShift[0])} ..`));
            const newUploadingZonePath = `${config.uploadingZonePath}\\${todaysDate}\\${path.basename(folderToShift[0])}`;
            if (isDryRun) {
                if (fs.existsSync(`${newUploadingZonePath}`)) {
                    lge(`Folder: ${newUploadingZonePath} already exists, cannot move ${folderToShift[0]} to its location.`);
                    doesDestinationFolderAlreadyExists = true;
                }
            } else {
                await createDirAndMoveFile(folderToShift[0], newUploadingZonePath);
                folderToShift[0] = newUploadingZonePath;
            }
            if (!isDryRun && cnt !== foldersToShiftLength - 1) {
                process.stdout.write(chalk.cyan(`..., `));
            }
        }
    }
    return doesDestinationFolderAlreadyExists;
}

const doesDestinationFolderAlreadyExists = await moveFilesFromContractorsToUploadingZone(true);
if (doesDestinationFolderAlreadyExists) {
    process.exit(0);
}
await moveFilesFromContractorsToUploadingZone(false);

if (!fs.existsSync(`${config.uploadingZonePath}\\${todaysDate}`)) {
    console.log(chalk.cyan(`No data present in the uploading zone, Exiting.`));
    process.exit(0);
}

const foldersToUpload = {};
// eslint-disable-next-line no-restricted-syntax
for (const uploadingZoneSubFolderAndFiles of fs.readdirSync(`${config.uploadingZonePath}\\${todaysDate}`)) {
    const uploadingZoneSubFolderPath = path.join(`${config.uploadingZonePath}\\${todaysDate}`, uploadingZoneSubFolderAndFiles);
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
                            await createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(returnObj.moveSource, returnObj.moveDestination, 2);
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
