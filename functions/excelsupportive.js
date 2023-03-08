// eslint-disable-next-line import/extensions
import { readDealerConfigurationFormatted } from './excel.js';

const dealerConfiguration = readDealerConfigurationFormatted();

function getImageNumbersToDownloadFromDC(dealerNumber, settingName) {
    const singleelement = dealerConfiguration.filter((a) => a['Dealer Number'] === dealerNumber)[0];
    const imageNumbersToDownload = singleelement[settingName].trim();
    return imageNumbersToDownload.split(',');
}

// eslint-disable-next-line import/prefer-default-export
export { getImageNumbersToDownloadFromDC };
