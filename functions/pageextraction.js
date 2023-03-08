import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import date from 'date-and-time';
/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { zeroPad } from './stringformatting.js';
import { makeDir, removeDir, generateTempFolderWithRandomText } from './filesystem.js';
import { getChecksumFromURL, downloadFileAndCompareWithChecksum } from './download.js';
import { getImageNumbersToDownloadFromDC } from './excelsupportive.js';
/* eslint-enable import/extensions */

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
    const imageNumbersToDownload = getImageNumbersToDownloadFromDC(dealerFolder);
    for (let index = 0; index < imageNumbersToDownload.length; index++) {
        const imageNumberToDownload = parseInt(imageNumbersToDownload[index], 10);
        if (imageNumberToDownload > imageOriginalURLS.length) {
            process.stdout.write(
                chalk.white.bgYellow.bold(
                    `\nWARNING: Under ${dealerFolder}/${stockNumber}, Unable to find image number: ${imageNumberToDownload}, Total images under page: ${imageOriginalURLS.length}.`
                )
            );
            // eslint-disable-next-line no-continue
            continue;
        }

        debug ? console.log(`Downloading image: ${imageOriginalURLS[imageNumberToDownload - 1]}`) : '';
        const file = fs.createWriteStream(`${tempPath}/${zeroPad(imageNumberToDownload, 3)}.jpg`);

        if (imageNumbersToDownload.length === 1) {
            debug ? '' : process.stdout.write(chalk.cyan(`${dealerFolder}/${stockNumber}${path.extname(path.basename(file.path))} »`));
        } else {
            debug ? '' : process.stdout.write(chalk.cyan(`${dealerFolder}/${stockNumber}/${path.basename(file.path)} »`));
        }

        const checksumOfFile = await getChecksumFromURL(imageOriginalURLS[imageNumberToDownload - 1], hashAlgo, debug);
        await downloadFileAndCompareWithChecksum(
            imageOriginalURLS[imageNumberToDownload - 1],
            file,
            tempPath,
            `${config.downloadPath}/${todaysDate}/${dealerFolder}/${stockNumber}/`,
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
