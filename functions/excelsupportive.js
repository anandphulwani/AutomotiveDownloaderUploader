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
