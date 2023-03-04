import { readDealerConfiguration } from './excel';

const dealerConfiguration = readDealerConfiguration();

function getImageNumbersToDownloadFromDC(dealerNumber, settingName) {
    const singleelement = dealerConfiguration.filter((a) => a['Dealer Number'] === dealerNumber)[0];
    const imageNumbersToDownload = singleelement[settingName].trim();
    return imageNumbersToDownload.split(',');
}

// eslint-disable-next-line import/prefer-default-export
export { getImageNumbersToDownloadFromDC };
