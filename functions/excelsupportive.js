// eslint-disable-next-line import/extensions
import { readDealerConfigurationFormatted } from './excel.js';

let dealerConfiguration = [];

function setCurrentDealerConfiguration(username) {
    const usernameTrimmed = username.includes('@') ? username.split('@')[0] : username;
    dealerConfiguration = readDealerConfigurationFormatted(usernameTrimmed);
}

function getSettingValueFromDC(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (dealerConfiguration === []) {
        return false;
    }
    const singleelement = dealerConfiguration.filter((a) => a[filterBySettingName] === filterBySettingValue)[0];
    const settingValues = singleelement[settingToExtract].trim();
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

function getAddTextToFolderNameFromDC(dealerNumber) {
    const addTextToFolderName = getSettingValueFromDC('Dealer Number', dealerNumber, 'Add text to folder name');
    if (addTextToFolderName === false) {
        return '';
    }
    return addTextToFolderName;
}

function getAllDealerNames() {
    const allDealerNames = dealerConfiguration.map((item) => item['Dealer Number']);
    if (allDealerNames === false) {
        return '';
    }
    return allDealerNames;
}

// eslint-disable-next-line import/prefer-default-export
export { setCurrentDealerConfiguration, getImageNumbersToDownloadFromDC, getAddTextToFolderNameFromDC, getDealerNameFromDC, getAllDealerNames };
