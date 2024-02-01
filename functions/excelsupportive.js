import fs from 'fs';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import ForceReadExcel from '../class/ForceReadExcel.js';
import { readDealerConfigurationExcel, readDealerConfigurationFormatted } from './excel.js';
import { lge, lgu } from './loggerandlocksupportive.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
/* eslint-enable import/extensions */

let dealerConfiguration = [];
let dealerConfigurationAsIs = [];
let currentActiveDealerConfigurationsUsername = '';
const lastDealerExcelModifiedTime = {};

function setCurrentDealerConfiguration(username, forceRead = ForceReadExcel.false) {
    const usernameTrimmed = getUsernameTrimmed(username);
    const excelFilename = `${config.dealerConfigurationPath}\\${usernameTrimmed}.xlsx`;
    if (!syncOperationWithErrorHandling(fs.existsSync, excelFilename)) {
        lge(`Dealer configuration excel file: ${excelFilename} does not exist, Please check.`);
        process.exit(1);
    }
    const excelFilenameStats = syncOperationWithErrorHandling(fs.statSync, excelFilename);

    if (
        (forceRead === ForceReadExcel.onlyIfModificationTimeChanges && lastDealerExcelModifiedTime[username] === String(excelFilenameStats.mtime)) ||
        (forceRead === ForceReadExcel.false && getCurrentActiveDealerConfigurationsUsername() === usernameTrimmed)
    ) {
        return;
    }
    dealerConfiguration = readDealerConfigurationFormatted(usernameTrimmed);
    dealerConfigurationAsIs = readDealerConfigurationExcel(usernameTrimmed);
    currentActiveDealerConfigurationsUsername = usernameTrimmed;
    lastDealerExcelModifiedTime[username] = String(excelFilenameStats.mtime);
}

function getCurrentActiveDealerConfigurationsUsername() {
    return currentActiveDealerConfigurationsUsername;
}

function getUsernameTrimmed(username) {
    return username.includes('@') ? username.split('@')[0] : username;
}

function getSettingValueFromDC(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (Array.isArray(dealerConfiguration) && dealerConfiguration.length === 0) {
        return undefined;
    }
    const indexOfObject = dealerConfiguration.findIndex((object) => object[filterBySettingName] === filterBySettingValue);
    if (indexOfObject === -1) {
        return undefined;
    }
    const singleelement = dealerConfiguration.filter((a) => a[filterBySettingName] === filterBySettingValue)[0];
    const settingValues = singleelement[settingToExtract] !== undefined ? singleelement[settingToExtract].trim() : undefined;
    return settingValues;
}

function getSettingValueFromDCAsIs(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (Array.isArray(dealerConfigurationAsIs) && dealerConfigurationAsIs.length === 0) {
        return undefined;
    }
    const indexOfObject = dealerConfigurationAsIs.findIndex((object) => object[filterBySettingName] === filterBySettingValue);
    if (indexOfObject === -1) {
        return undefined;
    }
    const singleelement = dealerConfigurationAsIs[indexOfObject];
    const settingValues = singleelement[settingToExtract];
    return settingValues;
}

function getImageNumbersToDownloadFromDC(dealerNumber) {
    const imageNumbersToDownload = getSettingValueFromDC('Dealer Number', dealerNumber, 'Image numbers to download');
    if (imageNumbersToDownload === undefined) {
        lgu(`getImageNumbersToDownloadFromDC(dealerNumber): Empty value for dealerNumber: '${dealerNumber}' or dealerNumber doesn't exit.`);
        process.exit(1);
    }
    return imageNumbersToDownload.split(',');
}

function getDealerNameFromDC(dealerNumber) {
    const dealerName = getSettingValueFromDC('Dealer Number', dealerNumber, 'Dealer Name');
    if (dealerName === undefined) {
        lgu(`getDealerNameFromDC(dealerNumber): Empty value for dealerNumber: '${dealerNumber}' or dealerNumber doesn't exit.`);
        process.exit(1);
    }
    return dealerName;
}

function getDealerNameFromDCAsIs(dealerNumber) {
    const dealerNameAsIs = getSettingValueFromDCAsIs('Dealer Number', dealerNumber, 'Dealer Name');
    if (dealerNameAsIs === undefined) {
        lgu(`getDealerNameFromDCAsIs(dealerNumber): Empty value for dealerNumber: '${dealerNumber}' or dealerNumber doesn't exit.`);
        process.exit(1);
    }
    return dealerNameAsIs;
}

function getAddTextToFolderNameFromDC(dealerNumber) {
    const addTextToFolderName = getSettingValueFromDC('Dealer Number', dealerNumber, 'Add text to folder name');
    if (addTextToFolderName === undefined) {
        lgu(`getAddTextToFolderNameFromDC(dealerNumber): Empty value for dealerNumber: '${dealerNumber}' or dealerNumber doesn't exit.`);
        process.exit(1);
    }
    return addTextToFolderName;
}

function getAddTextToFolderNameByUsernameFromDC(dealerNumber, username) {
    const usernameTrimmed = getUsernameTrimmed(username);
    if (getCurrentActiveDealerConfigurationsUsername() !== usernameTrimmed) {
        setCurrentDealerConfiguration(usernameTrimmed, ForceReadExcel.onlyIfModificationTimeChanges);
    }
    return getAddTextToFolderNameFromDC(dealerNumber);
}

function getAllDealerNumbers() {
    return dealerConfiguration.map((item) => item['Dealer Number']);
}

function getDeleteOriginalFromDC(dealerNumber) {
    return getBooleanValueFromDC(dealerNumber, 'Delete original');
}

function getShiftOriginalFirstPositionToLastPositionFromDC(dealerNumber) {
    return getBooleanValueFromDC(dealerNumber, 'Shift original 1st position to last position');
}

function getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerNumber) {
    return getBooleanValueFromDC(dealerNumber, 'Put 1st edited images in the last position also');
}

function getLockTheImagesCheckMarkFromDC(dealerNumber) {
    return getBooleanValueFromDC(dealerNumber, 'Lock the image (check mark)');
}

function getBooleanValueFromDC(dealerNumber, columnName) {
    const booleanValue = getSettingValueFromDC('Dealer Number', dealerNumber, columnName);
    if (booleanValue !== undefined && typeof booleanValue === 'string') {
        if (booleanValue.toLowerCase().trim() === 'yes') {
            return true;
        }
        if (booleanValue.toLowerCase().trim() === 'no') {
            return false;
        }
    }
    return undefined;
}

function getDealerObjByDealerNumber(dealerNumber) {
    return dealerConfiguration.filter((a) => a['Dealer Number'] === dealerNumber)[0];
}

function getDealerNumberWithDealerName() {
    return dealerConfiguration.map((item) => [item['Dealer Number'], item['Dealer Name']]);
}

// eslint-disable-next-line import/prefer-default-export
export {
    getCurrentActiveDealerConfigurationsUsername,
    getUsernameTrimmed,
    getAddTextToFolderNameByUsernameFromDC,
    setCurrentDealerConfiguration,
    getImageNumbersToDownloadFromDC,
    getAddTextToFolderNameFromDC,
    getDealerNameFromDC,
    getDealerNameFromDCAsIs,
    getAllDealerNumbers,
    getDeleteOriginalFromDC,
    getShiftOriginalFirstPositionToLastPositionFromDC,
    getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC,
    getLockTheImagesCheckMarkFromDC,
    getDealerObjByDealerNumber,
    getDealerNumberWithDealerName,
};
