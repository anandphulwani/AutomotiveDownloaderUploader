// eslint-disable-next-line import/extensions
import { readDealerConfigurationExcel, readDealerConfigurationFormatted } from './excel.js';

let dealerConfiguration = [];
let dealerConfigurationAsIs = [];

function setCurrentDealerConfiguration(username) {
    const usernameTrimmed = username.includes('@') ? username.split('@')[0] : username;
    dealerConfiguration = readDealerConfigurationFormatted(usernameTrimmed);
    dealerConfigurationAsIs = readDealerConfigurationExcel(usernameTrimmed);
}

function getSettingValueFromDC(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (dealerConfiguration === []) {
        return false;
    }
    const singleelement = dealerConfiguration.filter((a) => a[filterBySettingName] === filterBySettingValue)[0];
    const settingValues = singleelement[settingToExtract] !== undefined ? singleelement[settingToExtract].trim() : undefined;
    // const settingValues = singleelement[settingToExtract].trim();
    return settingValues;
}

function getSettingValueFromDCAsIs(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (dealerConfigurationAsIs === []) {
        return false;
    }
    const indexOfObject = dealerConfiguration.findIndex((object) => object[filterBySettingName] === filterBySettingValue);
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

function getAllDealerNumbers() {
    const allDealerNumbers = dealerConfiguration.map((item) => item['Dealer Number']);
    if (allDealerNumbers === false) {
        return '';
    }
    return allDealerNumbers;
}

function getDeleteOriginalFromDC(dealerNumber) {
    const deleteOriginal = getSettingValueFromDC('Dealer Number', dealerNumber, 'Delete original');
    if (deleteOriginal.toLowerCase().trim() === 'yes') {
        return true;
    }
    if (deleteOriginal.toLowerCase().trim() === 'no') {
        return false;
    }
    throw new Error(`getDeleteOriginalFromDC(dealerNumber): Invalid value: ${deleteOriginal} for dealerNumber: ${dealerNumber}.`);
}

function getShiftOriginalFirstPositionToLastPositionFromDC(dealerNumber) {
    const shiftOriginal = getSettingValueFromDC('Dealer Number', dealerNumber, 'Shift original 1st position to last position');
    if (shiftOriginal.toLowerCase().trim() === 'yes') {
        return true;
    }
    if (shiftOriginal.toLowerCase().trim() === 'no') {
        return false;
    }
    throw new Error(
        `getShiftOriginalFirstPositionToLastPositionFromDC(dealerNumber): Invalid value: ${shiftOriginal} for dealerNumber: ${dealerNumber}.`
    );
}

function getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerNumber) {
    const shiftOriginal = getSettingValueFromDC('Dealer Number', dealerNumber, 'Put 1st edited images in the last position also');
    if (shiftOriginal.toLowerCase().trim() === 'yes') {
        return true;
    }
    if (shiftOriginal.toLowerCase().trim() === 'no') {
        return false;
    }
    throw new Error(
        `getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerNumber): Invalid value: ${shiftOriginal} for dealerNumber: ${dealerNumber}.`
    );
}

function getLockTheImagesCheckMarkFromDC(dealerNumber) {
    const locktheImagesCheckMark = getSettingValueFromDC('Dealer Number', dealerNumber, 'Lock the image (check mark)');
    if (locktheImagesCheckMark.toLowerCase().trim() === 'yes') {
        return true;
    }
    if (locktheImagesCheckMark.toLowerCase().trim() === 'no') {
        return false;
    }
    if (locktheImagesCheckMark.toLowerCase().trim() === '') {
        return null;
    }
    throw new Error(`getLockTheImagesCheckMarkFromDC(dealerNumber): Invalid value: ${locktheImagesCheckMark} for dealerNumber: ${dealerNumber}.`);
}

// eslint-disable-next-line import/prefer-default-export
export {
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
