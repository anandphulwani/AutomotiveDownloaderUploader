import fs from 'fs';
import path from 'path';
import beautify from 'json-beautify';
import { spawn } from 'child_process';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getListOfSubfoldersStartingWith, removeDirAndRemoveParentDirIfEmpty } from './filesystem.js';
import { lgd, lgu } from './loggerandlocksupportive.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
import { getUsernameTrimmed } from './excelsupportive.js';
import { instanceRunDateFormatted } from './datetime.js';
import { zeroPad } from './stringformatting.js';
import { getLastLotDate, getLastLotNumber } from './configsupportive.js';
import { sleep } from './sleep.js';
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
function recalculateRatioOfThreshHoldWithOtherContractors(contractorsArr, totalOfNormalThreshold, debug = false) {
    contractorsArr.forEach((contractorEle) => {
        if (contractorEle.length >= 2) {
            if (contractorEle.length === 2) {
                contractorEle.push(Math.round((contractorEle[1] / totalOfNormalThreshold) * 100));
            } else {
                contractorEle[2] = Math.round((contractorEle[1] / totalOfNormalThreshold) * 100);
            }
        }
    });
    debug ? lgd(`recalculateRatioOfThreshHoldWithOtherContractors: ${beautify(contractorsArr, null, 3, 120)}`) : null;
    return contractorsArr;
}
/* #endregion */

/* #endregion */

/**
 * 002
 * Added ratio of images allotted to all contractors as the fifth column(RatioOfImagesAllotted) to generate something like in `Example`
 */
/* #region : recalculateRatioOfImagesAllotted(contractorsArr) {...} */

/* #region : Examples */
/**
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAllotted, RatioOfImagesAllotted ],
 *    [ 'ram', 300, 43, 50, 26 ],
 *    [ 'karan', 100, 14, 40, 21 ],
 *    [ 'pavan', 100, 14, 40, 21 ],
 *    [ 'arjun', 100, 14, 30, 16 ],
 *    [ 'om', 100, 14, 30, 16 ]
 * ]
 */
/* #endregion */
/* #region : CodeAbstract */
function recalculateRatioOfImagesAllotted(contractorsArr, debug = false) {
    const totalImgsAllotted = contractorsArr.map((row) => row[3]).reduce((accumulator, currentValue) => accumulator + currentValue);
    contractorsArr.forEach((contractorEle) => {
        if (contractorEle.length >= 4) {
            let ratio = Math.round((contractorEle[3] / totalImgsAllotted) * 100);
            ratio = Number.isNaN(ratio) ? 0 : ratio;
            if (contractorEle.length === 4) {
                contractorEle.push(ratio);
            } else {
                contractorEle[4] = ratio;
            }
        }
    });
    debug ? lgd(`recalculateRatioOfImagesAllotted: ${beautify(contractorsArr, null, 3, 120)}`) : null;
    return contractorsArr;
}
/* #endregion */

/* #endregion */

/**
 * 003
 * Calculated sixth column (AllotmentPriority) by subtracting RatioOfThreshHoldWithOtherContractors and RatioOfImagesAllotted to generate something like in `Example`
 */
/* #region : recalculateAllotmentPriority (contractorsArr){...} */

/* #region : Examples */
/**
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAllotted, RatioOfImagesAllotted,  AllotmentPriority(RatioOfThreshHoldWithOtherContractors - RatioOfImagesAllotted)],
 *    [ 'ram', 300, 43, 50, 26, 17 ],
 *    [ 'karan', 100, 14, 40, 21, -7 ],
 *    [ 'pavan', 100, 14, 40, 21, -7 ],
 *    [ 'arjun', 100, 14, 30, 16, -2 ],
 *    [ 'om', 100, 14, 30, 16, -2 ]
 * ]
 */
/* #endregion */
/* #region : CodeAbstract */
function recalculateAllotmentPriority(contractorsArr, debug = false) {
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
    debug ? lgd(`recalculateAllotmentPriority: ${beautify(contractorsArr, null, 3, 120)}`) : null;
    return contractorsArr;
}
/* #endregion */

/* #endregion */

/**
 * 004
 * Check whether LotFolder / Username / VINFolder / At least a single file{type:jpg} exists.
 * If no files exist and VINFolder is empty, remove the VINFolder if it is empty
 * Also remove the parents of VINFolder recursively if they are empty.
 * Also make sure one dealerDirectory with single file exists in the lot
 * Return all dealerDirs with an additional column of '0', later to be used to put image count
 */
/* #region : validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs (lotFldrPath, debug = false) {...} */
function validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs(lotFldrPath, debug = false) {
    let doesLotFolderPathContainsFiles = false;
    const dealerDirs = [];
    /* eslint-disable no-restricted-syntax, no-continue */
    for (const usernameLevelFolder of syncOperationWithErrorHandling(fs.readdirSync, lotFldrPath)) {
        const allUsernamesFromConfig = config.credentials.map((item) => getUsernameTrimmed(item.username));
        if (!allUsernamesFromConfig.includes(usernameLevelFolder)) {
            lgu(`Unknown folder '${usernameLevelFolder}' present in 'Downloads' path, Unable to continue allotment.`);
            process.exit(0);
        }
        const usernameLevelFolderPath = path.join(lotFldrPath, usernameLevelFolder);
        if (!syncOperationWithErrorHandling(fs.statSync, usernameLevelFolderPath).isDirectory()) {
            continue;
        }
        for (const dealerFolder of syncOperationWithErrorHandling(fs.readdirSync, usernameLevelFolderPath)) {
            const dealerFolderPath = path.join(usernameLevelFolderPath, dealerFolder);
            if (!syncOperationWithErrorHandling(fs.statSync, dealerFolderPath).isDirectory()) {
                continue;
            }
            for (const VINFolderOrFile of syncOperationWithErrorHandling(fs.readdirSync, dealerFolderPath)) {
                const VINFolderOrFilePath = path.join(dealerFolderPath, VINFolderOrFile);
                if (!syncOperationWithErrorHandling(fs.statSync, VINFolderOrFilePath).isDirectory()) {
                    doesLotFolderPathContainsFiles = true;
                    continue;
                }
                const VINFolderOrFileLength = syncOperationWithErrorHandling(fs.readdirSync, VINFolderOrFilePath).length;
                debug ? lgd(`VINFolderOrFilePath: ${VINFolderOrFilePath}     VINFolderOrFileLength: ${VINFolderOrFileLength}`) : null;
                VINFolderOrFileLength > 0
                    ? (doesLotFolderPathContainsFiles = true)
                    : removeDirAndRemoveParentDirIfEmpty(VINFolderOrFilePath, 3, true);
            }
            syncOperationWithErrorHandling(fs.existsSync, dealerFolderPath) ? dealerDirs.push(dealerFolderPath) : null;
        }
    }
    if (!doesLotFolderPathContainsFiles) {
        lgu(`The lot folder does not contain any files to allot.`);
        process.exit(1);
    }
    /* eslint-enable no-restricted-syntax, no-continue */
    return dealerDirs;
}
/* #endregion */

/**
 * 005
 * Get total image count from a dealer directory, which includes VIN folders and VIN files
 */
/* #region : returnImageCountFromDealerDir (lotFldrPath, debug = false) {...} */
function returnImageCountFromDealerDir(dealerDir, debug = false) {
    let totalNoOfDealerFolderFiles = 0;
    if (syncOperationWithErrorHandling(fs.existsSync, dealerDir)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const VINFolder of syncOperationWithErrorHandling(fs.readdirSync, dealerDir)) {
            const VINFolderPath = path.join(dealerDir, VINFolder);
            const VINFolderStat = syncOperationWithErrorHandling(fs.statSync, VINFolderPath);

            if (VINFolderStat.isDirectory()) {
                const VINFolderLength = syncOperationWithErrorHandling(fs.readdirSync, VINFolderPath).length;
                debug ? lgd(`VINFolderPath: ${VINFolderPath}     VINFolderLength: ${VINFolderLength}`) : null;
                if (VINFolderLength > 0) {
                    totalNoOfDealerFolderFiles += VINFolderLength;
                } else {
                    removeDirAndRemoveParentDirIfEmpty(VINFolderPath, 3, true);
                }
            } else {
                totalNoOfDealerFolderFiles += 1;
            }
        }
    }
    return totalNoOfDealerFolderFiles;
}
/* #endregion */

/**
 * 006
 * Launch lot window
 */
/* #region : launchLotWindow(lotIndexToAllot, debug = false) {...} */
function launchLotWindow(lotIndexToAllot, debug = false) {
    if (syncOperationWithErrorHandling(fs.existsSync, `${config.downloadPath}\\${instanceRunDateFormatted}\\Lot_${zeroPad(lotIndexToAllot, 2)}`)) {
        const subprocess = spawn(
            'cmd.exe',
            [
                '/c',
                'start',
                'cmd.exe',
                '/K',
                `@echo off && cd /D ${process.cwd()} && cls && node contractors_allotment.js ${lotIndexToAllot} ${instanceRunDateFormatted} && pause && pause && exit`,
            ],
            {
                detached: true,
                stdio: 'ignore',
            }
        );
        subprocess.unref();
    }
}
/* #endregion */

/**
 * 007
 * Get lot last index
 */
/* #region : getLotLastIndex(debug = false) {...} */
function getLotLastIndex(debug = false) {
    const lotIndexArray = getListOfSubfoldersStartingWith(`${config.downloadPath}\\${instanceRunDateFormatted}`, 'Lot_');
    let lotLastIndex = lotIndexArray.length > 0 ? parseInt(lotIndexArray[lotIndexArray.length - 1].substring(4), 10) : null;
    if (lotLastIndex === null) {
        if (getLastLotDate() === instanceRunDateFormatted) {
            lotLastIndex = parseInt(getLastLotNumber().substring(4), 10) + 1;
        } else {
            lotLastIndex = 1;
        }
    }
    return lotLastIndex;
}
/* #endregion */

/**
 * 008
 * Launch all pending lots window
 */
/* #region : launchAllPendingLotsWindow(debug = false) {...} */
function launchAllPendingLotsWindow(debug = false) {
    const lotIndexArray = getListOfSubfoldersStartingWith(`${config.downloadPath}\\${instanceRunDateFormatted}`, 'Lot_');
    lotIndexArray.pop();

    // eslint-disable-next-line no-restricted-syntax
    for (const lotIndexEle of lotIndexArray) {
        const lotIndexToAllot = parseInt(lotIndexEle.substring(4), 10);
        launchLotWindow(lotIndexToAllot);
        sleep(3);
    }
}
/* #endregion */

/* #endregion */

// eslint-disable-next-line import/prefer-default-export
export {
    recalculateRatioOfThreshHoldWithOtherContractors,
    recalculateRatioOfImagesAllotted,
    recalculateAllotmentPriority,
    validateLotFolderAndRemoveVINFolderIfEmptyAndReturnListOfDealerDirs,
    returnImageCountFromDealerDir,
    launchLotWindow,
    getLotLastIndex,
    launchAllPendingLotsWindow,
};
