import fs from 'fs';
import date from 'date-and-time';
// eslint-disable-next-line import/extensions
import { zeroPad } from './padding.js';
// eslint-disable-next-line import/extensions
import { makeDir, removeDir, generateTempFolderWithRandomText } from './filesystem.js';
// eslint-disable-next-line import/extensions
import { getChecksumFromURL, downloadFileAndCompareWithChecksum } from './download.js';
// eslint-disable-next-line import/extensions
import { getImageNumbersToDownloadFromDC } from './excelsupportive.js';

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');

async function getImagesFromContent(page, dealerFolder, debug = false) {
    const hashAlgo = 'sha1';
    const stockNumber = await page.$$eval('input#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_VehicleHeader_StockNumber', (el) =>
        el.map((x) => x.getAttribute('value'))
    );

    const imageDIVContainer = await page.$('.tn-list-container');
    const imageULContainer = await imageDIVContainer.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS = await imageULContainer.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));

    const tempPath = generateTempFolderWithRandomText();
    await makeDir(tempPath, debug);

    debug ? '' : process.stdout.write('\t');
    const imageNumbersToDownload = getImageNumbersToDownloadFromDC(dealerFolder, 'Image numbers to download');
    for (let index = 0; index < imageNumbersToDownload.length; index++) {
        // for (let index = 0; index < imageOriginalURLS.length; index++) {
        const imageNumberToDownload = parseInt(imageNumbersToDownload[index], 10);
        if (imageNumberToDownload >= imageOriginalURLS.length) {
            //  TODO: Continue prompt here.
            process.exit(1);
        }
        debug ? console.log(`Downloading image: ${imageOriginalURLS[imageNumberToDownload - 1]}`) : process.stdout.write('»');
        const file = fs.createWriteStream(`${tempPath}/${zeroPad(imageNumberToDownload, 3)}.jpg`);

        const checksumOfFile = await getChecksumFromURL(imageOriginalURLS[imageNumberToDownload - 1], hashAlgo, debug);
        await downloadFileAndCompareWithChecksum(
            imageOriginalURLS[imageNumberToDownload - 1],
            file,
            tempPath,
            `./Downloads/${todaysDate}/${dealerFolder}/${stockNumber}/`,
            imageNumbersToDownload.length === 1,
            hashAlgo,
            checksumOfFile,
            debug
        );
    }
    debug ? '' : process.stdout.write('\n');
    await removeDir(tempPath, debug);
}

// eslint-disable-next-line import/prefer-default-export
export { getImagesFromContent };
