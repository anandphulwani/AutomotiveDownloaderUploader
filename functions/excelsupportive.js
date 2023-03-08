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

// eslint-disable-next-line import/prefer-default-export
export { getImageNumbersToDownloadFromDC };
