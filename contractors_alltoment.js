import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import date from 'date-and-time';

import { exec } from 'child_process';
import { keyInYN } from 'readline-sync';

/* eslint-disable import/extensions */
import { zeroPad } from './functions/stringformatting.js';
import { config } from './configs/config.js';
import { getCredentialsForUsername, getAppDomain } from './functions/configsupportive.js';
import { msleep, sleep, waitForSeconds } from './functions/sleep.js';
import { printSectionSeperator, getSumOf2DArrayColumn, getIndexOfHighestIn2DArrayColumn } from './functions/others.js';
import { createDirAndMoveFile } from './functions/filesystem.js';
import { getAddTextToFolderNameFromDC } from './functions/excelsupportive.js';
/* eslint-enable import/extensions */

// TODO: Set contractors currentstatus to 0 if lot no is 1
// TODO: Make sure one single contractor exists
// TODO: Make sure one single dealerDirectory exists in the lot

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

const lotIndex = parseInt(process.argv[2], 10);
const lotFolderName = `Lot_${zeroPad(lotIndex, 2)}`;
const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
const { downloadPath } = config;

// ${config.downloadPath}/${todaysDate}/Lot_${zeroPad(lotIndex, 2)}/${usernameTrimmed}/${dealerFolder}/${stockNumber}/
const lotFolderPath = `${downloadPath}\\${todaysDate}\\${lotFolderName}`;
if (!fs.existsSync(lotFolderPath)) {
    console.log(chalk.white.bgRed.bold(`Lot folder path: ${lotFolderPath} does not exist, Please check.`));
    process.exit(1);
}
exec(`explorer.exe ${process.cwd()}\\${lotFolderPath}"`);
while (!keyInYN('Please review your lot folders, to remove any unneccesary photos, press Y to continue?')) {
    sleep(1);
}

const dealerDirectories = [];
fs.readdirSync(lotFolderPath).forEach((usernameFolder) => {
    // console.log(usernameFolder);
    const usernameFolderPath = path.join(lotFolderPath, usernameFolder);
    const usernameFolderStat = fs.statSync(usernameFolderPath);

    if (usernameFolderStat.isDirectory()) {
        fs.readdirSync(usernameFolderPath).forEach((dealerFolder) => {
            const dealerFolderPath = path.join(usernameFolderPath, dealerFolder);
            const dealerFolderStat = fs.statSync(dealerFolderPath);
            if (dealerFolderStat.isDirectory()) {
                let totalNoOfDealerFolderFiles = 0;
                fs.readdirSync(dealerFolderPath).forEach((stockFolder) => {
                    if (dealerFolderStat.isDirectory()) {
                        const stockFolderPath = path.join(dealerFolderPath, stockFolder);
                        const stockFolderLength = fs.readdirSync(stockFolderPath).length;
                        totalNoOfDealerFolderFiles += stockFolderLength;
                    } else {
                        totalNoOfDealerFolderFiles += 1;
                    }
                });
                dealerDirectories.push([dealerFolderPath, totalNoOfDealerFolderFiles]);
            }
        });
    }
});

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
 *
 * Alloting minimum DealerFolders For Each Contractors as per config
 * Adding allotment of images to all contractors as the last column to generate something like this:
 *
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted ],
 *    [ 'ram', 300, 43, 50 ],
 *    [ 'karan', 100, 14, 40 ],
 *    [ 'pavan', 100, 14, 40 ],
 *    [ 'arjun', 100, 14, 30 ],
 *    [ 'om', 100, 14, 30 ]
 * ]
 */
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
        await createDirAndMoveFile(dealerFolderPath, destinationPath);

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
console.log(`-----------------------------------------------------`);
// console.log(`imagesQtyAlloted: ${imagesQtyAlloted}`);

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
        await createDirAndMoveFile(dealerFolderPath, destinationPath);

        console.log(`${sourceDealerFolderName}         Alloted To           ${contractorAlloted} (${destinationDealerFolderName})`);
        // TODO: Add images quantity to current status in config

        contractors[contractorsIndex][3] += dealerFolderFilesCount;
        imagesQtyAlloted += dealerFolderFilesCount;

        // console.log(`imagesQtyAlloted: ${imagesQtyAlloted}`);
    }
    contractors = recalculateRatioOfImagesAlloted(contractors, imagesQtyAlloted);
    contractors = recalculateAllotmentPriority(contractors);
}

/**
 *
 * Added ratio of all contractors as the last column to generate something like this:
 *
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors ],
 *    [ 'ram', 300, 43 ],
 *    [ 'karan', 100, 14 ],
 *    [ 'pavan', 100, 14 ],
 *    [ 'arjun', 100, 14 ],
 *    [ 'om', 100, 14 ]
 * ]
 */
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
/**
 *
 * Added ratio of images alloted to all contractors as the last column to generate something like this:
 *
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted, RatioOfImagesAlloted ],
 *    [ 'ram', 300, 43, 50, 26 ],
 *    [ 'karan', 100, 14, 40, 21 ],
 *    [ 'pavan', 100, 14, 40, 21 ],
 *    [ 'arjun', 100, 14, 30, 16 ],
 *    [ 'om', 100, 14, 30, 16 ]
 * ]
 */
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

/**
 *
 * Added ratio of images alloted to all contractors as the last column to generate something like this:
 *
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAlloted, RatioOfImagesAlloted,  AllotmentPriority(RatioOfThreshHoldWithOtherContractors - RatioOfImagesAlloted)],
 *    [ 'ram', 300, 43, 50, 26, 17 ],
 *    [ 'karan', 100, 14, 40, 21, -7 ],
 *    [ 'pavan', 100, 14, 40, 21, -7 ],
 *    [ 'arjun', 100, 14, 30, 16, -2 ],
 *    [ 'om', 100, 14, 30, 16, -2 ]
 * ]
 */

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
