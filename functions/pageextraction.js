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
import { incRetryCount } from './others.js';
import { makeDir, removeDir, generateTempFolderWithRandomText } from './filesystem.js';
import { getChecksumFromURL, downloadFileAndCompareWithChecksum } from './download.js';
import { getImageNumbersToDownloadFromDC, getDealerNameFromDC } from './excelsupportive.js';
/* eslint-enable import/extensions */

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');

async function getImagesFromContent(page, lotIndex, username, dealerFolder, debug = false) {
    const usernameTrimmed = username.includes('@') ? username.split('@')[0] : username;
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
        return { result: false, bookmarkAppendMesg: '', imagesDownloaded: 0 };
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

    debug ? '' : process.stdout.write('  ');
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
        const shortFilenameTextLength = shortFilename.length + 2;

        let checksumOfFile;
        for (let checksumOfFileCnt = 0; checksumOfFileCnt < 5; checksumOfFileCnt++) {
            try {
                checksumOfFile = await getChecksumFromURL(imageOriginalURLS[imageNumberToDownload - 1], hashAlgo, debug);
                break;
            } catch (err) {
                if (
                    err.message.match(/Navigation timeout of \d* ms exceeded/g) ||
                    err.message.match(/net::ERR_CONNECTION_TIMED_OUT at .*/g) ||
                    err.message === 'socket hang up' ||
                    err.message === 'aborted' ||
                    err.message === 'read ECONNRESET'
                ) {
                    console.log(`SUCCESSFULLY ERROR HANDLED (WITHOUT HASH):#${err.message}#`);
                    process.stdout.write(chalk.yellow.bold(` ${logSymbols.warning}`));
                    if (checksumOfFileCnt < 4) {
                        // Sleep for 30 seconds
                        for (let cnt = 0; cnt < 10; cnt++) {
                            process.stdout.write(chalk.yellow.bold('.'));
                            await waitForSeconds(3);
                        }
                        incRetryCount();
                    } else {
                        console.log(
                            chalk.white.bgRed.bold(
                                `\nUnable to download the following file after 5 retries in interval of 30 seconds each, download operation timeout set to 15 seconds: ${shortFilename} .`
                            )
                        );
                        process.stdout.write('  ');
                    }
                } else {
                    console.log(`CATCH THIS ERROR (WITHOUT HASH):#${err.message}#`);
                    throw err;
                }
            }
        }
        if (checksumOfFile === undefined) {
            // eslint-disable-next-line no-continue
            continue;
        }

        for (let downloadCnt = 0; downloadCnt < 5; downloadCnt++) {
            try {
                await downloadFileAndCompareWithChecksum(
                    imageOriginalURLS[imageNumberToDownload - 1],
                    file,
                    tempPath,
                    `${config.downloadPath}/${todaysDate}/Lot_${zeroPad(lotIndex, 2)}/${usernameTrimmed}/${dealerFolder}/${stockNumber}/`,
                    imageNumbersToDownload.length === 1,
                    hashAlgo,
                    checksumOfFile,
                    shortFilenameTextLength,
                    debug
                );
                imagesDownloaded++;
                break;
            } catch (err) {
                if (
                    err.message.match(/Navigation timeout of \d* ms exceeded/g) ||
                    err.message.match(/net::ERR_CONNECTION_TIMED_OUT at .*/g) ||
                    err.message === 'socket hang up' ||
                    err.message === 'aborted' ||
                    err.message === 'read ECONNRESET'
                ) {
                    console.log(`SUCCESSFULLY ERROR HANDLED (WITHOUT HASH):#${err.message}#`);
                    process.stdout.write(chalk.yellow.bold(` ${logSymbols.warning}`));
                    if (downloadCnt < 4) {
                        // Sleep for 30 seconds
                        for (let cnt = 0; cnt < 10; cnt++) {
                            process.stdout.write(chalk.yellow.bold('.'));
                            await waitForSeconds(3);
                        }
                        incRetryCount();
                    } else {
                        console.log(
                            chalk.white.bgRed.bold(
                                `\nUnable to download the following file after 5 retries in interval of 30 seconds each, download operation timeout set to 15 seconds: ${shortFilename} .`
                            )
                        );
                        process.stdout.write('  ');
                    }
                } else {
                    console.log(`CATCH THIS ERROR (WITHOUT HASH):#${err.message}#`);
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
    // TODO: Make sure this removeDir runs properly
    removeDir(tempPath, true, debug);
    return { result: true, bookmarkAppendMesg: stockNumber, imagesDownloaded: imagesDownloaded };
}

// eslint-disable-next-line import/prefer-default-export
export { getImagesFromContent };
