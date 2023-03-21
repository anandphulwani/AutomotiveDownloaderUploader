/* #region : Supporting functions */ /* #endregion */
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import date from 'date-and-time';

import { exec } from 'child_process';
import { keyInYN } from 'readline-sync';

/* eslint-disable import/extensions */
import { zeroPad } from './functions/stringformatting.js';
import { config } from './configs/config.js';
import { msleep, sleep, waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator, getSumOf2DArrayColumn, getIndexOfHighestIn2DArrayColumn } from './functions/others.js';
import { removeDirAndRemoveParentDirIfEmpty, createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty } from './functions/filesystem.js';
import { getAddTextToFolderNameFromDC } from './functions/excelsupportive.js';
/* eslint-enable import/extensions */

// TODO: Set contractors currentstatus to 0 if lot no is 1

/* #region : Validation section 01 */
if (process.argv.length !== 3) {
    console.log(chalk.white.bgRed.bold(`Please start the program with right parameter 'node contractors_alltoment.js lotNoIndex' `));
    process.exit(1);
}
if (Number.isNaN(parseInt(process.argv[2], 10))) {
    console.log(
        chalk.white.bgRed.bold(
            `Please start the program with proper parameters 'node contractors_alltoment.js lotNoIndex', The first parameter(lotNoIndex) has to be a number.`
        )
    );
    process.exit(1);
}
if (!Object.keys(config.contractors).length > 0) {
    console.log(chalk.white.bgRed.bold(`No contractors available in config or the length is zero, please check config file.`));
    process.exit(1);
}
/* #endregion */

const lotIndex = parseInt(process.argv[2], 10);
const lotFolderName = `Lot_${zeroPad(lotIndex, 2)}`;
const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
const { downloadPath } = config;
const lotFolderPath = `${downloadPath}\\${todaysDate}\\${lotFolderName}`; // ${config.downloadPath}/${todaysDate}/Lot_${zeroPad(lotIndex, 2)}/${usernameTrimmed}/${dealerFolder}/${stockNumber}/

/* #region : Validation section 02 */
if (!fs.existsSync(lotFolderPath)) {
    console.log(chalk.white.bgRed.bold(`Lot folder path: ${lotFolderPath} does not exist, Please check.`));
    process.exit(1);
}
/* #endregion */

/* #region: CodeAbstract Commented */
/* 
let doesLotFolderPathContainsFiles = false;
// eslint-disable-next-line no-restricted-syntax
for (const usernameFolder of fs.readdirSync(lotFolderPath)) {
    if (!doesLotFolderPathContainsFiles) {
        const usernameFolderPath = path.join(lotFolderPath, usernameFolder);
        const usernameFolderStat = fs.statSync(usernameFolderPath);

        if (usernameFolderStat.isDirectory()) {
            // eslint-disable-next-line no-restricted-syntax
            for (const dealerFolder of fs.readdirSync(usernameFolderPath)) {
                if (!doesLotFolderPathContainsFiles) {
                    const dealerFolderPath = path.join(usernameFolderPath, dealerFolder);
                    const dealerFolderStat = fs.statSync(dealerFolderPath);

                    if (dealerFolderStat.isDirectory()) {
                        // eslint-disable-next-line no-restricted-syntax
                        for (const stockFolder of fs.readdirSync(dealerFolderPath)) {
                            if (!doesLotFolderPathContainsFiles) {
                                const stockFolderPath = path.join(dealerFolderPath, stockFolder);
                                const stockFolderStat = fs.statSync(stockFolderPath);

                                if (stockFolderStat.isDirectory()) {
                                    const stockFolderLength = fs.readdirSync(stockFolderPath).length;
                                    console.log(`stockFolderPath: ${stockFolderPath}     stockFolderLength: ${stockFolderLength}`);
                                    if (stockFolderLength > 0) {
                                        doesLotFolderPathContainsFiles = true;
                                    } else {
                                        await removeDirAndRemoveParentDirIfEmpty(stockFolderPath, true, true);
                                    }
                                } else {
                                    doesLotFolderPathContainsFiles = true;
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}
if (!doesLotFolderPathContainsFiles) {
    console.log(chalk.white.bgRed.bold(`The lot folder does not contain any files to allot.`));
    process.exit(1);
} */
/* #endregion */

await validateLotFolderAndReturnImageCount(lotFolderPath);

exec(`explorer.exe ${process.cwd()}\\${lotFolderPath}"`);
while (!keyInYN('Please review your lot folders, to remove any unneccesary photos, press Y to continue?')) {
    sleep(1);
}
const dealerDirectories = await validateLotFolderAndReturnImageCount(lotFolderPath);

/* #region: CodeAbstract Commented */
// const dealerDirectories = [];
// // eslint-disable-next-line no-restricted-syntax
// for (const usernameFolder of fs.readdirSync(lotFolderPath)) {
//     // console.log(usernameFolder);
//     const usernameFolderPath = path.join(lotFolderPath, usernameFolder);
//     const usernameFolderStat = fs.statSync(usernameFolderPath);

//     if (usernameFolderStat.isDirectory()) {
//         // eslint-disable-next-line no-restricted-syntax
//         for (const dealerFolder of fs.readdirSync(usernameFolderPath)) {
//             const dealerFolderPath = path.join(usernameFolderPath, dealerFolder);
//             const dealerFolderStat = fs.statSync(dealerFolderPath);

//             if (dealerFolderStat.isDirectory()) {
//                 let totalNoOfDealerFolderFiles = 0;
//                 // eslint-disable-next-line no-restricted-syntax
//                 for (const stockFolder of fs.readdirSync(dealerFolderPath)) {
//                     const stockFolderPath = path.join(dealerFolderPath, stockFolder);
//                     const stockFolderStat = fs.statSync(stockFolderPath);

//                     if (stockFolderStat.isDirectory()) {
//                         const stockFolderLength = fs.readdirSync(stockFolderPath).length;
//                         totalNoOfDealerFolderFiles += stockFolderLength;
//                     } else {
//                         totalNoOfDealerFolderFiles += 1;
//                     }
//                 }
//                 dealerDirectories.push([dealerFolderPath, totalNoOfDealerFolderFiles]);
//             }
//         }
//     }
// }
/* #endregion */

if (!dealerDirectories.length > 0) {
    console.log(chalk.white.bgRed.bold(`Lot folder path: ${lotFolderPath} does not contain any subfolders (dealer Folder), Please check.`));
    process.exit(1);
}

dealerDirectories.sort((a, b) => {
    if (a[1] === b[1]) {
        return 0;
    }
    return a[1] > b[1] ? -1 : 1;
});

// console.log(dealerDirectories);
// console.log(Object.keys(config.contractors));

let contractors = [];
let totalNoOfNormalThreshold = 0;

Object.keys(config.contractors).forEach((contractor) => {
    const { normalThreshold } = config.contractors[contractor];
    contractors.push([contractor, normalThreshold]);
    totalNoOfNormalThreshold += normalThreshold;
});

contractors.sort((a, b) => {
    if (a[1] === b[1]) {
        return 0;
    }
    return a[1] > b[1] ? -1 : 1;
});

contractors = recalculateRatioOfThreshHoldWithOtherContractors(contractors, totalNoOfNormalThreshold);

// Lot Configuration
let imagesQtyAlloted = 0;
const { minimumDealerFoldersForEachContractors, imagesQty } = config.lot[lotIndex - 1];
// console.log(minimumDealerFoldersForEachContractors);

/**
 * Alloting minimum DealerFolders for each contractors as per config
 * Adding allotment of images to all contractors as the last column to generate `Example01` below.
 * and setting last column to 0 if minimumDealerFoldersForEachContractors is false, to generate `Example02` below.
 */
/* #region: Examples */
/**
 * `Example01`
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted ],
 *    [ 'ram', 300, 43, 50 ],
 *    [ 'karan', 100, 14, 40 ],
 *    [ 'pavan', 100, 14, 40 ],
 *    [ 'arjun', 100, 14, 30 ],
 *    [ 'om', 100, 14, 30 ]
 * ]
 *
 * `Example02`
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted ],
 *    [ 'ram', 300, 43, 0 ],
 *    [ 'karan', 100, 14, 0 ],
 *    [ 'pavan', 100, 14, 0 ],
 *    [ 'arjun', 100, 14, 0 ],
 *    [ 'om', 100, 14, 0 ]
 * ]
 *
 */
/* #endregion */
/* #region: CodeAbstract */
if (minimumDealerFoldersForEachContractors !== false) {
    const minDealerFolders = minimumDealerFoldersForEachContractors * Object.keys(config.contractors).length;
    // console.log(`${minDealerFolders}:${dealerDirectories.length}`);
    for (let index = 0; index < minDealerFolders && dealerDirectories.length > 0; index++) {
        // console.log(`minDealerFolders: ${minDealerFolders}             dealerDirectories.length: ${dealerDirectories.length}`);
        const dealerFolderPath = dealerDirectories[0][0];
        const dealerFolderFilesCount = dealerDirectories[0][1];
        const contractorsIndex = index % contractors.length;
        const contractorAlloted = contractors[contractorsIndex][0];

        const sourceDealerFolderName = `${path.basename(path.dirname(dealerFolderPath))}/${path.basename(dealerFolderPath)}`;
        const addTextToFolderName = `${getAddTextToFolderNameFromDC(path.basename(dealerFolderPath))} ${contractorAlloted} ${dealerFolderFilesCount}`;

        const destinationPath = getChangePathFromDownloadToAllotment(dealerFolderPath, addTextToFolderName);
        const destinationDealerFolderName = `${path.basename(path.dirname(destinationPath))}/${path.basename(destinationPath)}`;
        // await createDirAndMoveFile(dealerFolderPath, destinationPath);
        await createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(dealerFolderPath, destinationPath, 3);

        console.log(`${sourceDealerFolderName}         Alloted To           ${contractorAlloted} (${destinationDealerFolderName})`);
        // TODO: Add images quantity to current status in config

        if (contractors[contractorsIndex].length === 3) {
            contractors[contractorsIndex].push(dealerFolderFilesCount);
        } else {
            contractors[contractorsIndex][3] += dealerFolderFilesCount;
        }
        imagesQtyAlloted += dealerFolderFilesCount;
        dealerDirectories.shift();
    }
} else {
    contractors.forEach((contractor) => {
        if (contractor.length === 3) {
            contractor.push(0);
        }
    });
}
/* #endregion */
console.log(`-----------------------------------------------------`);
// console.log(`imagesQtyAlloted: ${imagesQtyAlloted}`);

/**
 * Once the minimum DealerFolders for each contractors is alloted, using the pre allotted quantity
 * as the initial alloted quantity for the contractors, continuing there on
 * alloting to contractors as per config as in to maintain ratios, devised from the
 * quantity(ImagesQty) parameters in the config, to generate `Example03` below,
 * and updating the columns
 */
/* #region: Examples */
/**
 * `Example03`
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted, RatioOfImagesAlloted, AllotmentPriority(RatioOfThreshHoldWithOtherContractors - RatioOfImagesAlloted) ],
 *    [ 'ram', 300, 43, 50, 26, 17 ],
 *    [ 'karan', 100, 14, 40, 21, -7 ],
 *    [ 'pavan', 100, 14, 40, 21, -7 ],
 *    [ 'arjun', 100, 14, 30, 16, -2 ],
 *    [ 'om', 100, 14, 30, 16, -2 ]
 * ]
 */
/* #endregion */
/* #region: CodeAbstract */
if (imagesQty > 0 && imagesQty > imagesQtyAlloted) {
    for (let index = 0; index < dealerDirectories.length; index++) {
        const dealerFolderPath = dealerDirectories[index][0];
        const dealerFolderFilesCount = dealerDirectories[index][1];

        if (imagesQtyAlloted !== 0) {
            contractors = recalculateRatioOfImagesAlloted(contractors, imagesQtyAlloted);
            contractors = recalculateAllotmentPriority(contractors);
        }
        const contractorsIndex = getIndexOfHighestIn2DArrayColumn(contractors, 5);
        const contractorAlloted = contractors[contractorsIndex][0];

        const sourceDealerFolderName = `${path.basename(path.dirname(dealerFolderPath))}/${path.basename(dealerFolderPath)}`;
        const addTextToFolderName = `${getAddTextToFolderNameFromDC(path.basename(dealerFolderPath))} ${contractorAlloted} ${dealerFolderFilesCount}`;

        const destinationPath = getChangePathFromDownloadToAllotment(dealerFolderPath, addTextToFolderName);
        const destinationDealerFolderName = `${path.basename(path.dirname(destinationPath))}/${path.basename(destinationPath)}`;
        // await createDirAndMoveFile(dealerFolderPath, destinationPath);
        await createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(dealerFolderPath, destinationPath, 3);

        console.log(`${sourceDealerFolderName}         Alloted To           ${contractorAlloted} (${destinationDealerFolderName})`);
        // TODO: Add images quantity to current status in config

        contractors[contractorsIndex][3] += dealerFolderFilesCount;
        imagesQtyAlloted += dealerFolderFilesCount;

        // console.log(`imagesQtyAlloted: ${imagesQtyAlloted}`);
    }
    contractors = recalculateRatioOfImagesAlloted(contractors, imagesQtyAlloted);
    contractors = recalculateAllotmentPriority(contractors);
}
/* #endregion */

/* #region : Supporting functions */
/**
 * 001
 * Calculate ratio of all contractors as the third column to generate  something like in `Example`
 */
/* #region : recalculateRatioOfThreshHoldWithOtherContractors (contractorsArr, totalOfNormalThreshold) {...} */

/* #region : Examples */
/**
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors ],
 *    [ 'ram', 300, 43 ],
 *    [ 'karan', 100, 14 ],
 *    [ 'pavan', 100, 14 ],
 *    [ 'arjun', 100, 14 ],
 *    [ 'om', 100, 14 ]
 * ]
 */
/* #endregion */
/* #region : CodeAbstract */
function recalculateRatioOfThreshHoldWithOtherContractors(contractorsArr, totalOfNormalThreshold) {
    contractorsArr.forEach((contractorEle) => {
        if (contractorEle.length >= 2) {
            if (contractorEle.length === 2) {
                contractorEle.push(Math.round((contractorEle[1] / totalOfNormalThreshold) * 100));
            } else {
                contractorEle[2] = Math.round((contractorEle[1] / totalOfNormalThreshold) * 100);
            }
        }
    });
    // console.log(`recalculateRatioOfThreshHoldWithOtherContractors: `);
    // console.log(contractorsArr);
    return contractorsArr;
}
/* #endregion */

/* #endregion */

/**
 * 002
 * Added ratio of images alloted to all contractors as the fifth column(RatioOfImagesAlloted) to generate something like in `Example`
 */
/* #region : recalculateRatioOfImagesAlloted(contractorsArr, imgsQtyAlloted) {...} */

/* #region : Examples */
/**
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted, RatioOfImagesAlloted ],
 *    [ 'ram', 300, 43, 50, 26 ],
 *    [ 'karan', 100, 14, 40, 21 ],
 *    [ 'pavan', 100, 14, 40, 21 ],
 *    [ 'arjun', 100, 14, 30, 16 ],
 *    [ 'om', 100, 14, 30, 16 ]
 * ]
 */
/* #endregion */
/* #region : CodeAbstract */
function recalculateRatioOfImagesAlloted(contractorsArr, imgsQtyAlloted) {
    contractorsArr.forEach((contractorEle) => {
        if (contractorEle.length >= 4) {
            if (contractorEle.length === 4) {
                contractorEle.push(Math.round((contractorEle[3] / imgsQtyAlloted) * 100));
            } else {
                contractorEle[4] = Math.round((contractorEle[3] / imgsQtyAlloted) * 100);
            }
        }
    });
    // console.log(`recalculateRatioOfImagesAlloted: `);
    // console.log(contractorsArr);
    return contractorsArr;
}
/* #endregion */

/* #endregion */

/**
 * 003
 * Calculated sixth column (AllotmentPriority) by subtracting RatioOfThreshHoldWithOtherContractors and RatioOfImagesAlloted to generate something like in `Example`
 */
/* #region : recalculateAllotmentPriority (contractorsArr){...} */

/* #region : Examples */
/**
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted, RatioOfImagesAlloted,  AllotmentPriority(RatioOfThreshHoldWithOtherContractors - RatioOfImagesAlloted)],
 *    [ 'ram', 300, 43, 50, 26, 17 ],
 *    [ 'karan', 100, 14, 40, 21, -7 ],
 *    [ 'pavan', 100, 14, 40, 21, -7 ],
 *    [ 'arjun', 100, 14, 30, 16, -2 ],
 *    [ 'om', 100, 14, 30, 16, -2 ]
 * ]
 */
/* #endregion */
/* #region : CodeAbstract */
function recalculateAllotmentPriority(contractorsArr) {
    contractorsArr.forEach((contractorEle) => {
        if (contractorEle.length >= 5) {
            if (contractorEle.length === 5) {
                contractorEle.push(contractorEle[2] - contractorEle[4]);
            } else {
                contractorEle[5] = contractorEle[2] - contractorEle[4];
            }
        }
    });
    console.log(`recalculateAllotmentPriority: `);
    console.log(contractorsArr);
    return contractorsArr;
}
/* #endregion */

/* #endregion */

/**
 * 004
 * Convert the path of a folder from `Download` to `Allotment`
 */
/* #region : getChangePathFromDownloadToAllotment (sourcePath, additionalText){...} */
function getChangePathFromDownloadToAllotment(sourcePath, additionalText) {
    const sourcePathFoldersArr = [];
    for (let cnt = 0; cnt < 4; cnt++) {
        sourcePathFoldersArr.push(path.basename(sourcePath));
        sourcePath = path.dirname(sourcePath);
    }
    if (path.basename(sourcePath) !== 'Downloads') {
        process.exit(0);
    }
    sourcePath = `${path.dirname(sourcePath)}\\Allotment\\${sourcePathFoldersArr.reverse().join('\\')}`;
    sourcePath += ` ${additionalText}`;

    // console.log(sourcePathFoldersArr);
    // console.log(sourcePath);
    return sourcePath;
}
/* #endregion */

/**
 * 005
 * Check whether LotFolder / Username / StockFolder / At least a single file{type:jpg} exists.
 * If no files exist and stockFolder is empty, remove the stockFolder if it is empty
 * Also remove the parents of stockFolder recursively if they are empty.
 * Also make sure one dealerDirectory with single file exists in the lot
 */
/* #region : validateLotFolderAndReturnImageCount (lotFldrPath, debug = false) {...} */
async function validateLotFolderAndReturnImageCount(lotFldrPath, debug = false) {
    let doesLotFolderPathContainsFiles = false;
    const dealerDirs = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameFolder of fs.readdirSync(lotFldrPath)) {
        const usernameFolderPath = path.join(lotFldrPath, usernameFolder);
        const usernameFolderStat = fs.statSync(usernameFolderPath);

        if (usernameFolderStat.isDirectory()) {
            // eslint-disable-next-line no-restricted-syntax
            for (const dealerFolder of fs.readdirSync(usernameFolderPath)) {
                const dealerFolderPath = path.join(usernameFolderPath, dealerFolder);
                const dealerFolderStat = fs.statSync(dealerFolderPath);

                if (dealerFolderStat.isDirectory()) {
                    let totalNoOfDealerFolderFiles = 0;
                    // eslint-disable-next-line no-restricted-syntax
                    for (const stockFolder of fs.readdirSync(dealerFolderPath)) {
                        const stockFolderPath = path.join(dealerFolderPath, stockFolder);
                        const stockFolderStat = fs.statSync(stockFolderPath);

                        if (stockFolderStat.isDirectory()) {
                            const stockFolderLength = fs.readdirSync(stockFolderPath).length;
                            debug ? console.log(`stockFolderPath: ${stockFolderPath}     stockFolderLength: ${stockFolderLength}`) : '';
                            if (stockFolderLength > 0) {
                                doesLotFolderPathContainsFiles = true;
                                totalNoOfDealerFolderFiles += stockFolderLength;
                            } else {
                                removeDirAndRemoveParentDirIfEmpty(stockFolderPath, 3, true);
                            }
                        } else {
                            doesLotFolderPathContainsFiles = true;
                            totalNoOfDealerFolderFiles += 1;
                        }
                    }
                    dealerDirs.push([dealerFolderPath, totalNoOfDealerFolderFiles]);
                }
            }
        }
    }
    if (!doesLotFolderPathContainsFiles) {
        console.log(chalk.white.bgRed.bold(`The lot folder does not contain any files to allot.`));
        process.exit(1);
    }
    return dealerDirs;
}
/* #endregion */

/* #endregion */

// TODO: Put allotment folder in the config