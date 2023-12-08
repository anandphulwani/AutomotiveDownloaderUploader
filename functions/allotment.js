// ONPROJECTFINISH: Do cleanup
import chalk from 'chalk';
import path from 'path';
import fs from 'fs';
import { question } from 'readline-sync';
import beautify from 'json-beautify';

/* eslint-disable import/extensions */
import { zeroPad } from './stringformatting.js';
import { config } from '../configs/config.js';
import { attainLock, releaseLock, lge, lgi, lgs, lgu, lgd, lgtf } from './loggerandlocksupportive.js';
import { getIndexOfHighestIn2DArrayColumn } from './others.js';
import { createDirAndCopyFile, createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty } from './filesystem.js';
import { setCurrentDealerConfiguration, getAddTextToFolderNameFromDC } from './excelsupportive.js';
import { addToContractorsCurrentAllotted } from './configsupportive.js';
import { addAllotmentToReport } from './reportsupportive.js';
import { getBookmarkFolderGUIDFromUsernameDealerNumber, replaceBookmarksElementByGUIDAndWriteToBookmarksFile } from './bookmark.js';
import {
    recalculateRatioOfImagesAlloted,
    recalculateAllotmentPriority,
    getDealerFolderContractorsZonePath,
    getDealerFolderRecordKeepingZonePath,
} from './allotmentsupportive.js';
import Color from '../class/Colors.js';
/* eslint-enable import/extensions */

const contractorsNames = Object.entries(config.contractors)
    .filter(([, value]) => value.normalThreshold >= 0)
    .map(([key]) => key);

function getDealerDirectoryObjWithMaxImageCount(dealerDirectories) {
    return dealerDirectories.reduce((max, obj) => {
        if (obj.contractorAlloted !== null) {
            return max;
        }
        return max && max.imageCount > obj.imageCount ? max : obj;
    }, null);
}

function getLotConfigPropertiesValues(lotIndex) {
    const { minimumDealerFoldersForEachContractors } = config.lot[lotIndex - 1];
    const lotCfgImagesQty = config.lot[lotIndex - 1].imagesQty;
    const lotCfgMinDealerFolders =
        minimumDealerFoldersForEachContractors === false || minimumDealerFoldersForEachContractors === undefined
            ? undefined
            : minimumDealerFoldersForEachContractors * contractorsNames.length;
    return { lotCfgMinDealerFolders, lotCfgImagesQty };
}

async function executeSingleFolderAllotment(dealerDirectoryObj) {
    const { imageCount, username, dealerFolderName, dealerFolderPath, usernameAndDealerFolderName, contractorAlloted } = dealerDirectoryObj;
    const { uniqueId, destinationPath, destinationRecordKeepingPath, destinationFolderName } = dealerDirectoryObj;
    const bookmarkFolderGUID = getBookmarkFolderGUIDFromUsernameDealerNumber(username, dealerFolderName);
    replaceBookmarksElementByGUIDAndWriteToBookmarksFile('foldername', bookmarkFolderGUID, uniqueId);

    createDirAndCopyFile(dealerFolderPath, destinationRecordKeepingPath);
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(dealerFolderPath, destinationPath, false, 3);
    await addToContractorsCurrentAllotted(contractorAlloted, imageCount);
    addAllotmentToReport([[`#${uniqueId}`, usernameAndDealerFolderName, contractorAlloted, imageCount, destinationFolderName]]);
}

function getAllotmentMesgForFolder(dealerDirectoryObj, isDryRun) {
    let allotmentMesg = dealerDirectoryObj.usernameAndDealerFolderName.padEnd(30, ' ');
    allotmentMesg += isDryRun ? `  Prefferring To         ` : `  Alloted To         `;
    allotmentMesg += dealerDirectoryObj.contractorAlloted;
    allotmentMesg += ` (${dealerDirectoryObj.destinationFolderNameWithDate})`;
    allotmentMesg = allotmentMesg.padEnd(120, ' ');
    return allotmentMesg;
}

function getManualAllotmentContractorIndex(usernameAndDealerFolderName, imageCount, contractors) {
    let contractorsIndex;
    const contractorsSortedByPriority = contractors.map((contractor) => [...contractor]);
    contractorsSortedByPriority.sort((a, b) => {
        if (a[5] === b[5]) {
            return 0;
        }
        return a[5] > b[5] ? -1 : 1;
    });
    let currentPrioritySingleLine = 'Current priority: ';
    // eslint-disable-next-line no-loop-func
    contractorsSortedByPriority.forEach((value, innerIndex) => {
        const indexOfContractor = contractorsNames.indexOf(value[0]) + 1;
        let contractorSection = `[${indexOfContractor}]${value[0]} (${value[3]}/${value[5]})`;
        contractorSection += innerIndex < contractorsSortedByPriority.length - 1 ? '    ' : '';
        const lineNo = Math.floor(currentPrioritySingleLine.length / 120);
        const lineNoAfterAddingContractor = Math.floor((currentPrioritySingleLine.length + contractorSection.length) / 120);
        if (lineNo !== lineNoAfterAddingContractor) {
            currentPrioritySingleLine += `${' '.repeat(
                120 * lineNoAfterAddingContractor - currentPrioritySingleLine.length
            )}                  ${contractorSection}`;
        } else {
            currentPrioritySingleLine += contractorSection;
        }
    });
    lgi(
        `Allot            ${`${usernameAndDealerFolderName} (Qty:${imageCount})`.padEnd(20, ' ')}` +
            `                            To                            ???????`,
        Color.bgCyan
    );
    lgi(`${currentPrioritySingleLine}`, Color.cyan);

    let allotmentQuestion = `${contractorsNames
        .map((contractorsName, contractorInnerIndex) =>
            contractorsSortedByPriority[0][0] === contractorsName
                ? chalk.black.bgWhiteBright(`[${contractorInnerIndex + 1}] ${contractorsName}`)
                : `[${contractorInnerIndex + 1}] ${contractorsName}`
        )
        .join('\n')}\n`;
    allotmentQuestion += `[0] EXIT\n`;
    lgi(allotmentQuestion, Color.white);
    const indexOfPriorityContractor = contractorsNames.indexOf(contractorsSortedByPriority[0][0]) + 1;
    do {
        contractorsIndex = question('', { defaultInput: indexOfPriorityContractor.toString() });
        if (Number.isNaN(Number(contractorsIndex)) || Number(contractorsIndex) < 0 || Number(contractorsIndex) > contractorsNames.length) {
            lge('Invalid input, please try again: ');
        }
    } while (Number.isNaN(Number(contractorsIndex)) || Number(contractorsIndex) < 0 || Number(contractorsIndex) > contractorsNames.length);
    contractorsIndex--;

    contractorsIndex = contractors.findIndex((innerArr) => innerArr.indexOf(contractorsNames[contractorsIndex]) !== -1);
    if (contractorsIndex === -1) {
        process.exit(0);
    }
    return contractorsIndex;
}

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
async function doAllotment(
    dealerDirectories,
    contractors,
    lotIndex,

    isManualAllotment = false,
    debug = false
) {
    let doesDestinationFolderAlreadyExists = false;
    const { lotCfgMinDealerFolders, lotCfgImagesQty } = getLotConfigPropertiesValues(lotIndex);
    const isDryRun = dealerDirectories[0].uniqueId === null;
    if (isDryRun) {
        /** Running a dry run */
        /* #region validation checks */
        if (lotCfgImagesQty !== undefined) {
            let imagesQtyAllotedInCurrentLot = 0;
            for (let index = 0; index < dealerDirectories.length; index++) {
                if (lotCfgMinDealerFolders !== undefined && index < lotCfgMinDealerFolders) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
                if (imagesQtyAllotedInCurrentLot > lotCfgImagesQty) {
                    lgu(
                        `Unable to continue the allotment because the condition is true: imagesQtyAllotedInCurrentLot(${imagesQtyAllotedInCurrentLot}) > lotCfgImagesQty(${lotCfgImagesQty})`
                    );
                    process.exit(1);
                }
                imagesQtyAllotedInCurrentLot += dealerDirectories[index].imageCount;
            }
        }
        /* #endregion */
        for (let index = 0; index < dealerDirectories.length; index++) {
            const currentDealerDirectoryObj = getDealerDirectoryObjWithMaxImageCount(dealerDirectories);
            let contractorsIndex;

            if (isManualAllotment) {
                contractors = recalculateAllotmentPriority(recalculateRatioOfImagesAlloted(contractors));
                const { usernameAndDealerFolderName, imageCount } = currentDealerDirectoryObj;
                contractorsIndex = getManualAllotmentContractorIndex(usernameAndDealerFolderName, imageCount, contractors);
            } else if (lotCfgMinDealerFolders !== undefined && index < lotCfgMinDealerFolders) {
                /* allotment by minimum dealerFolders for each contractors as per config */
                contractorsIndex = index % contractors.length;
            } else if (lotCfgImagesQty !== undefined && lotCfgImagesQty > 0) {
                /* allotment by imagesQty */
                contractors = recalculateAllotmentPriority(recalculateRatioOfImagesAlloted(contractors));
                contractorsIndex = getIndexOfHighestIn2DArrayColumn(contractors, 5);
            } else {
                /* #region unreachable error mesg creation */
                const mesg = [];
                mesg.push(`Unable to allot the dealerDirectory(${currentDealerDirectoryObj.dealerFolderPath}) at this index(${index}), because:`);
                mesg.push(`    a. It is an automatic allotment.`);
                mesg.push(`    b. It is not in 'allotment by minimumDealerFolders for each contractors', because the below condition is false`);
                mesg.push(
                    `lotCfgMinDealerFolders(${lotCfgMinDealerFolders}) !== undefined && index(${index}) < lotCfgMinDealerFolders(${lotCfgMinDealerFolders})`
                );
                mesg.push(`    c. It is not in 'allotment by imagesQty', because the below condition is false`);
                mesg.push(`lotCfgImagesQty(${lotCfgImagesQty}) !== undefined && lotCfgImagesQty(${lotCfgImagesQty}) > 0`);
                /* #endregion */
                lgu(mesg.join('\n'));
                process.exit(1);
            }
            const [contractorAlloted] = contractors[contractorsIndex];
            currentDealerDirectoryObj.contractorAlloted = contractorAlloted;
            /* Adding allotment of images to the currentAllotment for all contractors */
            contractors[contractorsIndex][3] += currentDealerDirectoryObj.imageCount;
        }

        for (let index = 0; index < dealerDirectories.length; index++) {
            dealerDirectories[index].uniqueId = zeroPad(lotIndex, 2) + zeroPad(index + 1, 3);
            const allotmentMesg = getAllotmentMesgForFolder(dealerDirectories[index], true);
            !isManualAllotment ? lgi(allotmentMesg, Color.bgCyan) : null;
            /* #region Check paths already exists */
            const pathsToCheck = [dealerDirectories[index].destinationRecordKeepingPath, dealerDirectories[index].destinationPath];
            for (let i = 0; i < pathsToCheck.length; i++) {
                if (fs.existsSync(pathsToCheck[i])) {
                    lge(`Folder: ${pathsToCheck[i]} already exists, cannot process ${dealerDirectories[index].dealerFolderPath} to its location.`);
                    doesDestinationFolderAlreadyExists = true;
                }
            }
            /* #endregion */
        }
    } else {
        /** Running actualy allotment, confirmed in the previous dryRun */
        for (let index = 0; index < dealerDirectories.length; index++) {
            await executeSingleFolderAllotment(dealerDirectories[index]);
            const allotmentMesg = getAllotmentMesgForFolder(dealerDirectories[index], false);
            lgi(allotmentMesg, Color.bgGreen);
        }
    }
    return doesDestinationFolderAlreadyExists;
}

// eslint-disable-next-line import/prefer-default-export
export { doAllotment };
