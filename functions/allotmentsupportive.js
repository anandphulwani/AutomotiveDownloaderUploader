// ONPROJECTFINISH: Do cleanup
import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { removeDirAndRemoveParentDirIfEmpty } from './filesystem.js';
/* eslint-enable import/extensions */

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
/* #region : recalculateRatioOfImagesAlloted(contractorsArr) {...} */

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
function recalculateRatioOfImagesAlloted(contractorsArr) {
    const totalImgsAlloted = contractorsArr.map((row) => row[3]).reduce((accumulator, currentValue) => accumulator + currentValue);
    contractorsArr.forEach((contractorEle) => {
        if (contractorEle.length >= 4) {
            let ratio = Math.round((contractorEle[3] / totalImgsAlloted) * 100);
            ratio = Number.isNaN(ratio) ? 0 : ratio;
            if (contractorEle.length === 4) {
                contractorEle.push(ratio);
            } else {
                contractorEle[4] = ratio;
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
            let allotmentPriority = contractorEle[2] - contractorEle[4];
            allotmentPriority = Number.isNaN(allotmentPriority) ? 0 : allotmentPriority;
            if (contractorEle.length === 5) {
                contractorEle.push(allotmentPriority);
            } else {
                contractorEle[5] = allotmentPriority;
            }
        }
    });
    // console.log(`recalculateAllotmentPriority: `);
    // console.log(contractorsArr);
    return contractorsArr;
}
/* #endregion */

/* #endregion */

/**
 * 004
 * Convert the path of a folder from `Download` to `Allotment`
 */
/* #region : getDealerFolderContractorsZonePath (sourcePath, contractorsName, additionalText){...} */
function getDealerFolderContractorsZonePath(sourcePath, contractorsName, additionalText) {
    const sourcePathFoldersArr = [];
    for (let cnt = 0; cnt < 4; cnt++) {
        sourcePathFoldersArr.push(path.basename(sourcePath));
        sourcePath = path.dirname(sourcePath);
    }
    if (path.resolve(sourcePath) !== path.resolve(config.downloadPath)) {
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: Unknown state in getDealerFolderContractorsZonePath function, the resolve of '${sourcePath}' does not match '${config.downloadPath}'.`
            )
        );
        process.exit(0);
    }
    sourcePathFoldersArr.reverse();
    sourcePathFoldersArr.splice(1, 2);

    sourcePath = `${config.contractorsZonePath}\\${contractorsName}\\${sourcePathFoldersArr.join('\\')}`;
    sourcePath += ` ${additionalText}`;
    return sourcePath;
}

function getDealerFolderRecordKeepingZonePath(sourcePath, additionalText) {
    const sourcePathFoldersArr = [];
    for (let cnt = 0; cnt < 4; cnt++) {
        sourcePathFoldersArr.push(path.basename(sourcePath));
        sourcePath = path.dirname(sourcePath);
    }
    if (path.resolve(sourcePath) !== path.resolve(config.downloadPath)) {
        console.log(
            chalk.white.bgRed.bold(
                `ERROR: Unknown state in getDealerFolderContractorsZonePath function, the resolve of '${sourcePath}' does not match '${config.downloadPath}'.`
            )
        );
        process.exit(0);
    }
    sourcePathFoldersArr.reverse();
    sourcePathFoldersArr.splice(1, 2);

    sourcePath = `${config.recordKeepingZonePath}\\${sourcePathFoldersArr.join('\\')}`;
    sourcePath += ` ${additionalText}`;
    return sourcePath;
}
/* #endregion */

/**
 * 005
 * Check whether LotFolder / Username / VINFolder / At least a single file{type:jpg} exists.
 * If no files exist and VINFolder is empty, remove the VINFolder if it is empty
 * Also remove the parents of VINFolder recursively if they are empty.
 * Also make sure one dealerDirectory with single file exists in the lot
 * Return all dealerDirs with an additional column of '0', later to be used to put image count
 */
/* #region : validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs (lotFldrPath, debug = false) {...} */
async function validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs(lotFldrPath, debug = false) {
    let doesLotFolderPathContainsFiles = false;
    const dealerDirs = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const usernameFolder of fs.readdirSync(lotFldrPath)) {
        // TODO: one of the config.credentials.username matches usernameFolder
        const usernameFolderPath = path.join(lotFldrPath, usernameFolder);

        if (fs.statSync(usernameFolderPath).isDirectory()) {
            // eslint-disable-next-line no-restricted-syntax
            for (const dealerFolder of fs.readdirSync(usernameFolderPath)) {
                const dealerFolderPath = path.join(usernameFolderPath, dealerFolder);

                if (fs.statSync(dealerFolderPath).isDirectory()) {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const VINFolder of fs.readdirSync(dealerFolderPath)) {
                        const VINFolderPath = path.join(dealerFolderPath, VINFolder);

                        if (fs.statSync(VINFolderPath).isDirectory()) {
                            const VINFolderLength = fs.readdirSync(VINFolderPath).length;
                            debug ? console.log(`VINFolderPath: ${VINFolderPath}     VINFolderLength: ${VINFolderLength}`) : '';
                            if (VINFolderLength > 0) {
                                doesLotFolderPathContainsFiles = true;
                            } else {
                                removeDirAndRemoveParentDirIfEmpty(VINFolderPath, 3, true);
                            }
                        } else {
                            doesLotFolderPathContainsFiles = true;
                        }
                    }
                    if (fs.existsSync(dealerFolderPath)) {
                        dealerDirs.push([dealerFolderPath, 0]);
                    }
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

/**
 * 006
 * Get total image count from a dealer directory, which includes VIN folders and VIN files
 */
/* #region : returnImageCountFromDealerDirs (lotFldrPath, debug = false) {...} */
async function returnImageCountFromDealerDirs(dealerDirs, debug = false) {
    // eslint-disable-next-line no-restricted-syntax
    for (const dealerDir of dealerDirs) {
        if (fs.existsSync(dealerDir[0])) {
            let totalNoOfDealerFolderFiles = 0;
            // eslint-disable-next-line no-restricted-syntax
            for (const VINFolder of fs.readdirSync(dealerDir[0])) {
                const VINFolderPath = path.join(dealerDir[0], VINFolder);
                const VINFolderStat = fs.statSync(VINFolderPath);

                if (VINFolderStat.isDirectory()) {
                    const VINFolderLength = fs.readdirSync(VINFolderPath).length;
                    debug ? console.log(`VINFolderPath: ${VINFolderPath}     VINFolderLength: ${VINFolderLength}`) : '';
                    if (VINFolderLength > 0) {
                        totalNoOfDealerFolderFiles += VINFolderLength;
                    } else {
                        removeDirAndRemoveParentDirIfEmpty(VINFolderPath, 3, true);
                    }
                } else {
                    totalNoOfDealerFolderFiles += 1;
                }
            }
            dealerDir[1] = totalNoOfDealerFolderFiles;
        }
    }
    return dealerDirs;
}
/* #endregion */

// eslint-disable-next-line import/prefer-default-export
export {
    recalculateRatioOfThreshHoldWithOtherContractors,
    recalculateRatioOfImagesAlloted,
    recalculateAllotmentPriority,
    getDealerFolderContractorsZonePath,
    getDealerFolderRecordKeepingZonePath,
    validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs,
    returnImageCountFromDealerDirs,
};
