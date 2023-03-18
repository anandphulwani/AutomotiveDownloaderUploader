// eslint-disable-next-line import/extensions
import { readDealerConfigurationFormatted } from './excel.js';

const dealerConfiguration = readDealerConfigurationFormatted();

function getSettingValueFromDC(filterBySettingName, filterBySettingValue, settingToExtract) {
    const singleelement = dealerConfiguration.filter((a) => a[filterBySettingName] === filterBySettingValue)[0];
    const settingValues = singleelement[settingToExtract].trim();
    return settingValues;
}

function getImageNumbersToDownloadFromDC(dealerNumber) {
    let imageNumbersToDownload = getSettingValueFromDC('Dealer Number', dealerNumber, 'Image numbers to download');
    imageNumbersToDownload = imageNumbersToDownload.split(',');
    return imageNumbersToDownload;
}

function getDealerNameFromDC(dealerNumber) {
    const dealerName = getSettingValueFromDC('Dealer Number', dealerNumber, 'Dealer Name');
    return dealerName;
}

function getAddTextToFolderNameFromDC(dealerNumber) {
    const addTextToFolderName = getSettingValueFromDC('Dealer Number', dealerNumber, 'Add text to folder name');
    return addTextToFolderName;
}

function getAllDealerNames() {
    // const allDealerNames = dealerConfiguration.filter((a) => a[filterBySettingName] === filterBySettingValue)[0];
    const allDealerNames = dealerConfiguration.map((item) => item['Dealer Number']);
    return allDealerNames;
}

// eslint-disable-next-line import/prefer-default-export
export { getImageNumbersToDownloadFromDC, getAddTextToFolderNameFromDC, getDealerNameFromDC, getAllDealerNames };
//
//
/**
 * Array of values of the specified column name
 * console.log(data.map((item) => item['Dealer Number']));
 *
 * Array of objects, with row number as key, column name and column value as object
 * const test = Object.fromEntries(data.map((entry, index) => [index + 1, { 'Dealer Number': entry['Dealer Number'] }]));
 * console.log(test);
 *
 * Array of bjects, without any key, column name and column value as object
 * const redux1 = (list) => list.map((o) => Object.fromEntries(['Dealer Number'].map((k) => [k, o[k]])));
 * console.log(redux1(data));
 *
 */
