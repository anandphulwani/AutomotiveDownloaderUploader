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
import { addToContractorsCurrentAllotted, getLotConfigPropertiesValues } from './configsupportive.js';
import { addAllotmentToReport } from './reportsupportive.js';
import { getBookmarkFolderGUIDFromUsernameDealerNumber, replaceBookmarksElementByGUIDAndWriteToBookmarksFile } from './bookmark.js';
import {
    recalculateRatioOfImagesAllotted,
    recalculateAllotmentPriority,
    getDealerFolderContractorsZonePath,
    getDealerFolderRecordKeepingZonePath,
} from './allotmentsupportive.js';
import Color from '../class/Colors.js';
/* eslint-enable import/extensions */

function checkDealerDirectoriesExistsInBookmarkFile(dealerDirectories, isDryRun) {
    for (let index = 0; index < dealerDirectories.length; index++) {
        const { username, dealerFolderName } = dealerDirectories[index];
        const bookmarkFolderGUID = getBookmarkFolderGUIDFromUsernameDealerNumber(username, dealerFolderName);
        if (bookmarkFolderGUID === null) {
            lge(
                `While ${
                    isDryRun ? 'validating' : 'executing'
                }, bookmark for the '${username}/${dealerFolderName}' is removed in bookmark file by syncing, cannot continue the allotment process.`
            );
            process.exit(1);
        }
    }
}

function getDealerDirectoryObjWithMaxImageCount(dealerDirectories) {
    return dealerDirectories.reduce((max, obj) => {
        if (obj.contractorAllotted !== null) {
            return max;
        }
        return max && max.imageCount > obj.imageCount ? max : obj;
    }, null);
}

async function executeSingleFolderAllotment(dealerDirectoryObj) {
    const { imageCount, username, dealerFolderName, dealerFolderPath, usernameAndDealerFolderName, contractorAllotted } = dealerDirectoryObj;
    const { uniqueId, destinationPath, destinationRecordKeepingPath, destinationFolderName } = dealerDirectoryObj;
    const bookmarkFolderGUID = getBookmarkFolderGUIDFromUsernameDealerNumber(username, dealerFolderName);
    replaceBookmarksElementByGUIDAndWriteToBookmarksFile('foldername', bookmarkFolderGUID, uniqueId);

    createDirAndCopyFile(dealerFolderPath, destinationRecordKeepingPath);
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(dealerFolderPath, destinationPath, false, 3);
    await addToContractorsCurrentAllotted(contractorAllotted, imageCount);
    addAllotmentToReport([[`#${uniqueId}`, usernameAndDealerFolderName, contractorAllotted, imageCount, destinationFolderName]]);
}

function getAllotmentMesgForFolder(dealerDirectoryObj, isDryRun) {
    let allotmentMesg = dealerDirectoryObj.usernameAndDealerFolderName.padEnd(30, ' ');
    allotmentMesg += isDryRun ? `  Prefferring To         ` : `  Allotted To         `;
    allotmentMesg += dealerDirectoryObj.contractorAllotted;
    allotmentMesg += ` (${dealerDirectoryObj.destinationFolderNameWithDate})`;
    allotmentMesg = allotmentMesg.padEnd(120, ' ');
    return allotmentMesg;
}

const contractorsNames = Object.keys(config.contractors);
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
 * Once the minimum DealerFolders for each contractors is allotted, using the pre allotted quantity
 * as the initial allotted quantity for the contractors, continuing there on
 * alloting to contractors as per config as in to maintain ratios, devised from the
 * quantity(ImagesQty) parameters in the config, to generate `Example03` below,
 * and updating the columns
 */
/* #region: Examples */
/**
 * `Example03`
 * [
 * // [ 'NameOfContractor', NormalThreshold, RatioOfThreshHoldWithOtherContractors, ImagesAllotted, RatioOfImagesAllotted, AllotmentPriority(RatioOfThreshHoldWithOtherContractors - RatioOfImagesAllotted) ],
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
    checkDealerDirectoriesExistsInBookmarkFile(dealerDirectories, isDryRun);
    if (isDryRun) {
        /** Running a dry run */
        for (let index = 0; index < dealerDirectories.length; index++) {
            const currentDealerDirectoryObj = getDealerDirectoryObjWithMaxImageCount(dealerDirectories);
            let contractorsIndex;

            if (isManualAllotment) {
                contractors = recalculateAllotmentPriority(recalculateRatioOfImagesAllotted(contractors));
                const { usernameAndDealerFolderName, imageCount } = currentDealerDirectoryObj;
                contractorsIndex = getManualAllotmentContractorIndex(usernameAndDealerFolderName, imageCount, contractors);
            } else if (lotCfgMinDealerFolders !== undefined && index < lotCfgMinDealerFolders) {
                /* allotment by minimum dealerFolders for each contractors as per config */
                contractorsIndex = index % contractors.length;
            } else if (lotCfgImagesQty !== undefined) {
                /* allotment by imagesQty */
                contractors = recalculateAllotmentPriority(recalculateRatioOfImagesAllotted(contractors));
                contractorsIndex = getIndexOfHighestIn2DArrayColumn(contractors, 5);
            } else {
                /* #region unreachable error mesg creation */
                const mesg = [];
                mesg.push(`Unable to allot the dealerDirectory(${currentDealerDirectoryObj.dealerFolderPath}) at this index(${index}), because:`);
                mesg.push(`    a. It is an automatic allotment.`);
                mesg.push(
                    `    b. It is not in 'allotment by minimumDealerFolders for each contractors', because the below condition is false. (below index starts with 0)`
                );
                mesg.push(
                    `lotCfgMinDealerFolders(${lotCfgMinDealerFolders}) !== undefined && index(${index}) < lotCfgMinDealerFolders(${lotCfgMinDealerFolders})`
                );
                mesg.push(`    c. It is not in 'allotment by imagesQty', because the below condition is false`);
                mesg.push(`lotCfgImagesQty(${lotCfgImagesQty}) !== undefined`);
                /* #endregion */
                lgu(mesg.join('\n'));
                process.exit(1);
            }
            const [contractorAllotted] = contractors[contractorsIndex];
            currentDealerDirectoryObj.contractorAllotted = contractorAllotted;
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
