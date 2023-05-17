import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lgc } from './loggersupportive.js';
import { removeDir } from './filesystem.js';
/* eslint-enable import/extensions */

function autoCleanUpDatastoreZones(noOfDaysDataToKeep = 5) {
    const foldersToCleanUp = [
        config.lockingBackupsZonePath,
        config.downloadPath,
        config.recordKeepingZonePath,
        config.uploadingZonePath,
        config.finishedUploadingZonePath,
        `${config.finishedUploadingZonePath}\\DeletedUrls`,
        `.\\logs`, // Static delete after 120 days
    ];

    // eslint-disable-next-line no-restricted-syntax
    for (const folderToCleanUp of foldersToCleanUp) {
        if (!fs.existsSync(folderToCleanUp)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const folderPathChildren = fs.readdirSync(folderToCleanUp);
        // eslint-disable-next-line no-loop-func
        const folderPathChildrenSubDirsOnly = folderPathChildren.filter(
            (file) => fs.lstatSync(path.join(folderToCleanUp, file)).isDirectory() && /^\d{4}-\d{2}-\d{2}$/.test(file)
        ); // Filter out only subdirectories and subdirectories which match YYYY-MM-DD format using regex
        folderPathChildrenSubDirsOnly.sort(); // Sort subdirectories by name
        const folderPathChildrenSubDirsToDelete = folderPathChildrenSubDirsOnly.slice(0, folderToCleanUp !== `.\\logs` ? -noOfDaysDataToKeep : -120); // Delete all but the last 5 subdirectories

        // eslint-disable-next-line no-restricted-syntax
        for (const folderPathChildrenSubDirToDelete of folderPathChildrenSubDirsToDelete) {
            const directoryPath = path.join(folderToCleanUp, folderPathChildrenSubDirToDelete);
            removeDir(directoryPath, true);
        }
    }
}

function getNumberOfImagesFromAllottedDealerNumberFolder(folderName) {
    const regexString = `.*? (\\d+) \\(\\#\\d{5}\\)`;
    const regexExpression = new RegExp(regexString, 'g');

    if (!regexExpression.test(folderName)) {
        lgc('Unable to match regex for fn getNumberOfImagesFromAllottedDealerNumberFolder()');
        process.exit(1);
    }

    const match = folderName.match(regexExpression);
    return match[0].match(regexString)[1];
}

function getUniqueIDFromAllottedDealerNumberFolder(folderName) {
    const regexString = `.*? (\\d+) \\(\\#(\\d{5})\\)`;
    const regexExpression = new RegExp(regexString, 'g');

    if (!regexExpression.test(folderName)) {
        lgc('Unable to match regex for fn getUniqueIDFromAllottedDealerNumberFolder()');
        process.exit(1);
    }

    const match = folderName.match(regexExpression);
    return match[0].match(regexString)[2];
}

function getUploadRemainingSummary(foldersToUpload) {
    const dealerFoldersQty = Object.keys(foldersToUpload).filter(
        (key) => foldersToUpload[key].imagesQty !== 0 && foldersToUpload[key].dealerFolderFilesQty !== 0
    ).length;
    const totalImagesQty = Object.values(foldersToUpload).reduce((acc, folder) => acc + folder.imagesQty, 0);
    const totalStockFolderFilesQty = Object.values(foldersToUpload).reduce((acc, folder) => acc + folder.dealerFolderFilesQty, 0);
    const totalTimeInSeconds = Math.round(totalImagesQty * 7.25 + totalStockFolderFilesQty * 7);
    const durationHours = Math.floor(totalTimeInSeconds / 3600)
        .toString()
        .padStart(2, '0');
    const durationMinutes = Math.floor((totalTimeInSeconds - durationHours * 3600) / 60)
        .toString()
        .padStart(2, '0');
    const durationSeconds = (totalTimeInSeconds % 60).toString().padStart(2, '0');

    const currentTime = new Date(); // Get current time
    currentTime.setHours(currentTime.getHours() + parseInt(durationHours, 10));
    currentTime.setMinutes(currentTime.getMinutes() + parseInt(durationMinutes, 10));
    currentTime.setSeconds(currentTime.getSeconds() + parseInt(durationSeconds, 10));

    const options = { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }; // Format the time in hh:mm:ss tt format
    const finishedTime = currentTime.toLocaleString('en-US', options);

    return `Remaining DealerFolders: ${dealerFoldersQty}, Images: ${totalImagesQty}, StockFolder/StockFiles: ${totalStockFolderFilesQty}, Time: ${durationHours}:${durationMinutes}:${durationSeconds}, Will finish it at ${finishedTime}.`;
}
// eslint-disable-next-line import/prefer-default-export
export {
    autoCleanUpDatastoreZones,
    getNumberOfImagesFromAllottedDealerNumberFolder,
    getUniqueIDFromAllottedDealerNumberFolder,
    getUploadRemainingSummary,
};
