/* eslint-disable import/extensions */
import { readDealerConfigurationExcel, readDealerConfigurationFormatted } from './excel.js';
import { lgu } from './loggerandlocksupportive.js';
/* eslint-enable import/extensions */

let dealerConfiguration = [];
let dealerConfigurationAsIs = [];
let currentActiveDealerConfigurationsUsername = '';

function setCurrentDealerConfiguration(username) {
    const usernameTrimmed = getUsernameTrimmed(username);
    if (getCurrentActiveDealerConfigurationsUsername() !== usernameTrimmed) {
        dealerConfiguration = readDealerConfigurationFormatted(usernameTrimmed);
        dealerConfigurationAsIs = readDealerConfigurationExcel(usernameTrimmed);
        currentActiveDealerConfigurationsUsername = usernameTrimmed;
    }
}

function getCurrentActiveDealerConfigurationsUsername() {
    return currentActiveDealerConfigurationsUsername;
}

function getUsernameTrimmed(username) {
    return username.includes('@') ? username.split('@')[0] : username;
}

function getSettingValueFromDC(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (Array.isArray(dealerConfiguration) && dealerConfiguration.length === 0) {
        return false;
    }
    const singleelement = dealerConfiguration.filter((a) => a[filterBySettingName] === filterBySettingValue)[0];
    const settingValues = singleelement[settingToExtract] !== undefined ? singleelement[settingToExtract].trim() : undefined;
    return settingValues;
}

function getSettingValueFromDCAsIs(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (Array.isArray(dealerConfigurationAsIs) && dealerConfigurationAsIs.length === 0) {
        return false;
    }
    const indexOfObject = dealerConfigurationAsIs.findIndex((object) => object[filterBySettingName] === filterBySettingValue);
    if (indexOfObject === -1) {
        return false;
    }
    const singleelement = dealerConfigurationAsIs[indexOfObject];
    const settingValues = singleelement[settingToExtract];
    return settingValues;
}

function getImageNumbersToDownloadFromDC(dealerNumber) {
    let imageNumbersToDownload = getSettingValueFromDC('Dealer Number', dealerNumber, 'Image numbers to download');
    if (imageNumbersToDownload === false) {
        return '';
    }
    imageNumbersToDownload = imageNumbersToDownload.split(',');
    return imageNumbersToDownload;
}

function getDealerNameFromDC(dealerNumber) {
    const dealerName = getSettingValueFromDC('Dealer Number', dealerNumber, 'Dealer Name');
    if (dealerName === false) {
        return '';
    }
    return dealerName;
}

function getDealerNameFromDCAsIs(dealerNumber) {
    const dealerNameAsIs = getSettingValueFromDCAsIs('Dealer Number', dealerNumber, 'Dealer Name');
    if (dealerNameAsIs === false) {
        return '';
    }
    return dealerNameAsIs;
}

function getAddTextToFolderNameFromDC(dealerNumber) {
    const addTextToFolderName = getSettingValueFromDC('Dealer Number', dealerNumber, 'Add text to folder name');
    if (addTextToFolderName === undefined || addTextToFolderName === false) {
        return '';
    }
    return addTextToFolderName;
}

function getAddTextToFolderNameByUsernameFromDC(dealerNumber, username) {
    const usernameTrimmed = getUsernameTrimmed(username);
    if (getCurrentActiveDealerConfigurationsUsername() !== usernameTrimmed) {
        setCurrentDealerConfiguration(usernameTrimmed);
    }
    return getAddTextToFolderNameFromDC(dealerNumber);
}

function getAllDealerNumbers() {
    const allDealerNumbers = dealerConfiguration.map((item) => item['Dealer Number']);
    if (allDealerNumbers === false) {
        return '';
    }
    return allDealerNumbers;
}

// eslint-disable-next-line consistent-return
function getDeleteOriginalFromDC(dealerNumber) {
    const deleteOriginal = getSettingValueFromDC('Dealer Number', dealerNumber, 'Delete original');
    if (deleteOriginal.toLowerCase().trim() === 'yes') {
        return true;
    }
    if (deleteOriginal.toLowerCase().trim() === 'no') {
        return false;
    }
    lgu(`getDeleteOriginalFromDC(dealerNumber): Invalid value: ${deleteOriginal} for dealerNumber: ${dealerNumber}.`);
    process.exit(1);
}

// eslint-disable-next-line consistent-return
function getShiftOriginalFirstPositionToLastPositionFromDC(dealerNumber) {
    const shiftOriginal = getSettingValueFromDC('Dealer Number', dealerNumber, 'Shift original 1st position to last position');
    if (shiftOriginal.toLowerCase().trim() === 'yes') {
        return true;
    }
    if (shiftOriginal.toLowerCase().trim() === 'no') {
        return false;
    }
    lgu(`getShiftOriginalFirstPositionToLastPositionFromDC(dealerNumber): Invalid value: ${shiftOriginal} for dealerNumber: ${dealerNumber}.`);
    process.exit(1);
}

// eslint-disable-next-line consistent-return
function getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerNumber) {
    const shiftOriginal = getSettingValueFromDC('Dealer Number', dealerNumber, 'Put 1st edited images in the last position also');
    if (shiftOriginal.toLowerCase().trim() === 'yes') {
        return true;
    }
    if (shiftOriginal.toLowerCase().trim() === 'no') {
        return false;
    }
    lgu(
        `getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerNumber): Invalid value: ${shiftOriginal} for dealerNumber: ${dealerNumber}.`
    );
    process.exit(1);
}

// eslint-disable-next-line consistent-return
function getLockTheImagesCheckMarkFromDC(dealerNumber) {
    const locktheImagesCheckMark = getSettingValueFromDC('Dealer Number', dealerNumber, 'Lock the image (check mark)');
    if (locktheImagesCheckMark !== undefined) {
        if (locktheImagesCheckMark.toLowerCase().trim() === 'yes') {
            return true;
        }
        if (locktheImagesCheckMark.toLowerCase().trim() === 'no') {
            return false;
        }
    } else {
        return null;
    }
    lgu(`getLockTheImagesCheckMarkFromDC(dealerNumber): Invalid value: ${locktheImagesCheckMark} for dealerNumber: ${dealerNumber}.`);
    process.exit(1);
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
};
