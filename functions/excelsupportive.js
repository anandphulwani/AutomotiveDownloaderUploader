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
    const settingValues = singleelement[settingToExtract].trim();
    return settingValues;
}

function getSettingValueFromDCAsIs(filterBySettingName, filterBySettingValue, settingToExtract) {
    if (dealerConfigurationAsIs === []) {
        return false;
    }
    const singleelement = dealerConfigurationAsIs.filter((a) => a[filterBySettingName] === filterBySettingValue)[0];
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
    if (addTextToFolderName === false) {
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

// eslint-disable-next-line import/prefer-default-export
export {
    setCurrentDealerConfiguration,
    getImageNumbersToDownloadFromDC,
    getAddTextToFolderNameFromDC,
    getDealerNameFromDC,
    getDealerNameFromDCAsIs,
    getAllDealerNumbers,
};
