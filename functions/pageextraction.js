import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';
import date from 'date-and-time';
import { decode } from 'html-entities';
/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { zeroPad } from './stringformatting.js';
import { waitForSeconds } from './sleep.js';
import { makeDir, removeDir, generateTempFolderWithRandomText } from './filesystem.js';
import { getChecksumFromURL, downloadFileAndCompareWithChecksum } from './download.js';
import { getImageNumbersToDownloadFromDC, getDealerNameFromDC } from './excelsupportive.js';
/* eslint-enable import/extensions */

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');

async function getImagesFromContent(page, dealerFolder, debug = false) {
    const hashAlgo = 'sha1';
    /**
     * Get dealer name from excel and compare it with dealer name in the page: Begin
     */
    const dealerNameFromDC = getDealerNameFromDC(dealerFolder);
    const dealerNameFromPage = decode(
        String(
            await page.$$eval(
                'a#ctl00_ctl00_ContentPlaceHolder_ctl00_BrandingBar_VirtualRooftopSelector_DropdownActionButton > span > span > span > span',
                (el) => el.map((x) => x.innerHTML)
            )
        )
    );

    if (dealerNameFromDC.toLowerCase() !== dealerNameFromPage.toLowerCase()) {
        console.log(
            chalk.white.bgYellow.bold(
                `\nWARNING: Dealer folder: ${dealerFolder} name mismatch, name from web is '${dealerNameFromPage}' vs excel is '${dealerNameFromDC}'.`
            )
        );
        return false;
    }
    /**
     * Get dealer name from excel and compare it with dealer name in the page: End
     */
    const stockNumber = String(
        await page.$$eval('input#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_VehicleHeader_StockNumber', (el) =>
            el.map((x) => x.getAttribute('value'))
        )
    );

    const imageDIVContainer = await page.$('.tn-list-container');
    const imageULContainer = await imageDIVContainer.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS = await imageULContainer.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));

    const tempPath = generateTempFolderWithRandomText();
    await makeDir(tempPath, debug);

    debug ? '' : process.stdout.write('\t');
    const imageNumbersToDownload = getImageNumbersToDownloadFromDC(dealerFolder);
    let imagesDownloaded = 0;
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

        let shortFilename = '';
        if (imageNumbersToDownload.length === 1) {
            shortFilename = `${dealerFolder}/${stockNumber}${path.extname(path.basename(file.path))}`;
        } else {
            shortFilename = `${dealerFolder}/${stockNumber}/${path.basename(file.path)}`;
        }
        debug ? '' : process.stdout.write(chalk.white(`${shortFilename} »`));

        const checksumOfFile = await getChecksumFromURL(imageOriginalURLS[imageNumberToDownload - 1], hashAlgo, debug);
        for (let downloadCnt = 0; downloadCnt < 5; downloadCnt++) {
            try {
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
                imagesDownloaded++;
                break;
            } catch (err) {
                if (err.message === 'socket hang up') {
                    process.stdout.write(chalk.yellow.bold(` ${logSymbols.warning}`));
                    if (downloadCnt < 4) {
                        // Sleep for 30 seconds
                        for (let cnt = 0; cnt < 10; cnt++) {
                            process.stdout.write(chalk.yellow.bold('.'));
                            await waitForSeconds(3);
                        }
                    } else {
                        console.log(
                            chalk.white.bgRed.bold(
                                `\nUnable to download the following file after 5 retries in interval of 30 seconds each, download operation timeout set to 15 seconds: ${shortFilename} .`
                            )
                        );
                        process.stdout.write('\t');
                    }
                } else {
                    throw err;
                }
            }
        }
    }
    process.stdout.write(
        chalk.cyan.bgWhiteBright(
            `\nImages (Downloaded/Requested)  /Available: (${imagesDownloaded}/${imageNumbersToDownload.length})  /${imageOriginalURLS.length}         `
        )
    );
    debug ? '' : process.stdout.write('\n');
    await removeDir(tempPath, debug);
    return stockNumber;
}

// eslint-disable-next-line import/prefer-default-export
export { getImagesFromContent };
