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
// eslint-disable-next-line import/prefer-default-export
export { doAllotment };
