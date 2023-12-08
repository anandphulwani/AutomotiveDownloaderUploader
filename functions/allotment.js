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

// eslint-disable-next-line import/prefer-default-export
export { doAllotment };
