import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { sleep, msleep, waitForSeconds } from './sleep.js';
import { clickOnButton } from './actionOnElements.js';
import {
    getDealerNameFromDCAsIs,
    getDeleteOriginalFromDC,
    getShiftOriginalFirstPositionToLastPositionFromDC,
    getPutFirstEditedImagesInTheLastPositionAlsoFromDC,
    getLockTheImageCheckMarkFromDC,
} from './excelsupportive.js';
import { getRowPosOnTerminal } from './terminal.js';
import { gotoURL } from './goto.js';
import { getAppDomain } from './configsupportive.js';
import { waitForElementContainsOrEqualsHTML, waitTillCurrentURLEndsWith } from './waiting.js';
import { zeroPad } from './stringformatting.js';
/* eslint-enable import/extensions */

async function uploadBookmarkURL(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, URL, debug = false) {
    const startingRow = await getRowPosOnTerminal();
    process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;

    for (let gotoIndex = 0; gotoIndex < 24; gotoIndex++) {
        if (page.url() !== URL) {
            await gotoURL(page, URL, debug);
        }
        if (page.url().startsWith(`${getAppDomain()}/dashboard?`)) {
            debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
            debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
            debug ? '' : process.stdout.cursorTo(0);
            process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)\n`));
            await waitForSeconds(5);
            return {
                result: false,
                bookmarkAppendMesg: 'Ignoring (Does not Exist)',
                imagesDownloaded: 0,
            };
        }
        const pageContent = await page.content();
        if (pageContent.includes('/Framework/Resources/Images/Layout/Errors/500_error.png')) {
            process.stdout.write(chalk.yellow.bold(` ${logSymbols.warning}`));
            if (gotoIndex < 4) {
                // Sleep for 5 mins
                for (let cnt = 0; cnt < 100; cnt++) {
                    process.stdout.write(chalk.yellow.bold('.'));
                    await waitForSeconds(3);
                }
            } else {
                console.log(
                    chalk.white.bgRed.bold(`\nUnable to open the url after 24 retries in interval of 5 mins each (2 hours), found error 500.`)
                );
                process.exit(0);
            }
        } else {
            break;
        }
    }

    const returnObj = await uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder);
    // await waitForSeconds(10, true);
    return returnObj;
}

async function uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, debug = false) {
    // console.log(uniqueIdElement);
    // console.log(dealerFolder);
    const deleteOriginalFromDC = getDeleteOriginalFromDC(dealerFolder);
    const shiftOriginalFirstPositionToLastPositionFromDC = getShiftOriginalFirstPositionToLastPositionFromDC(dealerFolder);
    const putFirstEditedImagesInTheLastPositionAlsoFromDC = getPutFirstEditedImagesInTheLastPositionAlsoFromDC(dealerFolder);
    const lockTheImageCheckMarkFromDC = getLockTheImageCheckMarkFromDC(dealerFolder);
    /**
     * Get dealer name from excel and compare it with dealer name in the page: Begin
     */
    const dealerNameFromDCAsIs = getDealerNameFromDCAsIs(dealerFolder);
    const dealerNameFromPage = String(
        await page.$$eval(
            'a#ctl00_ctl00_ContentPlaceHolder_ctl00_BrandingBar_VirtualRooftopSelector_DropdownActionButton > span > span > span > span',
            (el) => el.map((x) => x.innerHTML)
        )
    );

    if (dealerNameFromDCAsIs !== dealerNameFromPage) {
        console.log(
            chalk.white.bgYellow.bold(
                `\nWARNING: Dealer folder: ${dealerFolder} name mismatch, name from web is '${dealerNameFromPage}' vs excel is '${dealerNameFromDCAsIs}'.`
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
    const stockFolderPath = `${uniqueIdFolderPath}\\${stockNumber}`;

    if (!fs.existsSync(stockFolderPath)) {
        // TODO: Give error and exit
        process.exit(0);
    }

    const imageDIVContainer = await page.$('.tn-list-container');
    const imageULContainer = await imageDIVContainer.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS = await imageULContainer.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength = imageOriginalURLS.length;

    await clickOnButton(page, '.vehicle-detail-tab.vehicle-detail-tab-imagery');
    await waitTillCurrentURLEndsWith(page, '#imagery');
    console.log(`${uniqueIdFolderPath}\\${stockNumber}`);
    // await waitForSeconds(3, true);

    // eslint-disable-next-line no-useless-catch
    try {
        let firstImagePath;
        // eslint-disable-next-line no-restricted-syntax
        for (const stockFolderSubFolderAndFiles of fs.readdirSync(stockFolderPath)) {
            const stockFolderSubFolderAndFilesPath = path.join(stockFolderPath, stockFolderSubFolderAndFiles);
            if (firstImagePath === undefined) {
                firstImagePath = stockFolderSubFolderAndFilesPath;
            }
            const stockFolderSubFolderAndFilesStat = fs.statSync(stockFolderSubFolderAndFilesPath);

            if (stockFolderSubFolderAndFilesStat.isFile()) {
                // console.log(uploadingZoneSubFolderPath);
                const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
                await fileChooser.accept([path.resolve(stockFolderSubFolderAndFilesPath)]);
            }
        }
        await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
        if (putFirstEditedImagesInTheLastPositionAlsoFromDC) {
            const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
            await fileChooser.accept([path.resolve(firstImagePath)]);
        }
    } catch (error) {
        console.log(`error01:${error}`);
    }

    await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
    // await waitForSeconds(2, true);

    const imageDIVContainer2 = await page.$('.tn-list-container');
    const imageULContainer2 = await imageDIVContainer2.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS2 = await imageULContainer2.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength2 = imageOriginalURLS2.length;
    // console.log(imageOriginalURLSLength2);
    // process.exit(1);
    console.log('Doing the move now');

    if (true || shiftOriginalFirstPositionToLastPositionFromDC) {
        try {
            const firstPositionIdSelector = `#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_ImagerySection_ctl01_ctl00 > div.dealer-images > div.tn-list-container > ul > li:nth-child(1)`;
            const lastPositionIdSelector = `#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_ImagerySection_ctl01_ctl00 > div.dealer-images > div.tn-list-container > ul > li:nth-child(${zeroPad(
                imageOriginalURLSLength2,
                2
            )})`;

            const firstPositionElement = await page.waitForSelector(firstPositionIdSelector);
            const lastPositionElement = await page.waitForSelector(lastPositionIdSelector);
            // Find its coordinates
            let firstPositionElementRect = await page.evaluate((el) => {
                const { x, y, width, height } = el.getBoundingClientRect();
                return { x, y, width, height };
            }, firstPositionElement);
            await page.mouse.move(
                firstPositionElementRect.x + firstPositionElementRect.width / 2,
                firstPositionElementRect.y + firstPositionElementRect.height / 2,
                { steps: 1 }
            );
            await page.mouse.down();
            // msleep(100);
            // await page.mouse.move(
            //     firstPositionElementRect.x + firstPositionElementRect.width / 2 + 10,
            //     firstPositionElementRect.y + firstPositionElementRect.height / 2 + 10,
            //     { steps: 1 }
            // );
            // msleep(100);
            // await page.mouse.move(
            //     firstPositionElementRect.x + firstPositionElementRect.width / 2 + 20,
            //     firstPositionElementRect.y + firstPositionElementRect.height / 2 + 20,
            //     { steps: 1 }
            // );
            // msleep(100);
            await page.evaluate((element) => element.scrollIntoView(), lastPositionElement);
            await page.waitForFunction(
                (element) => {
                    const { top, bottom } = element.getBoundingClientRect();
                    // eslint-disable-next-line no-undef
                    const viewportHeight = window.innerHeight;
                    return top >= 0 && bottom <= viewportHeight;
                },
                {},
                lastPositionElement
            );
            msleep(100);

            //
            //
            //
            //
            //
            let lastPositionElementRect = await page.evaluate((el) => {
                const { x, y, width, height } = el.getBoundingClientRect();
                return { x, y, width, height };
            }, lastPositionElement);
            await page.mouse.move(
                lastPositionElementRect.x + lastPositionElementRect.width / 2 - 1,
                lastPositionElementRect.y + lastPositionElementRect.height / 2, // + 10
                { steps: 1 }
            );
            await waitForSeconds(3, true);

            //
            //
            //
            //
            let oldLastPositionElementRectX;
            for (let lastIndex = 1; lastIndex < 200; lastIndex++) {
                lastPositionElementRect = await page.evaluate((el) => {
                    const { x, y, width, height } = el.getBoundingClientRect();
                    return { x, y, width, height };
                }, lastPositionElement);
                if (oldLastPositionElementRectX !== undefined && Math.abs(lastPositionElementRect.x - oldLastPositionElementRectX) > 50) {
                    console.log(`breaking now ${oldLastPositionElementRectX} > ${lastPositionElementRect.x}`);
                    break;
                }
                msleep(10);

                console.log(`Last Position Of Element: X:${lastPositionElementRect.x}`); // , Y:${lastPositionElementRect.y}`);
                console.log(
                    chalk.yellowBright(`Moving Element To:        X:${lastPositionElementRect.x + lastIndex}`) // , Y:${lastPositionElementRect.y + 35}`)
                );
                await page.mouse.move(
                    lastPositionElementRect.x + lastPositionElementRect.width / 2 + lastIndex - 1,
                    lastPositionElementRect.y + lastPositionElementRect.height / 2, // + 10
                    { steps: 1 }
                );
                oldLastPositionElementRectX = lastPositionElementRect.x;
            }
            await waitForSeconds(2, true);
            await page.mouse.up();
        } catch (error) {
            console.log(`handled this:${error}`);
            await waitForSeconds(240, true);
        }
    }
    await waitForSeconds(200, true);
    process.exit(0);

    const ImagesAreLockedFromWeb = await page.evaluate(
        // eslint-disable-next-line no-undef
        (selector) => document.querySelector(selector).checked,
        'input[type="checkbox"].vp[property-name="ImagesAreLocked"]'
    );
    console.log(ImagesAreLockedFromWeb);

    if (ImagesAreLockedFromWeb !== lockTheImageCheckMarkFromDC) {
        clickOnButton(page, 'input[type="checkbox"].vp[property-name="ImagesAreLocked"]');
    }

    console.log('Done');

    await waitForSeconds(6000, true);

    process.exit(0);
    sleep(10);
    sleep(10);

    // debug ? '' : process.stdout.write('  ');
    // const imageNumbersToDownload = getImageNumbersToDownloadFromDC(dealerFolder);
    // let imagesDownloaded = 0;
    // for (let index = 0; index < imageNumbersToDownload.length; index++) {
    //     const imageNumberToDownload = parseInt(imageNumbersToDownload[index], 10);
    //     if (imageNumberToDownload > imageOriginalURLS.length) {
    //         process.stdout.write(
    //             chalk.white.bgYellow.bold(
    //                 `\nWARNING: Under ${dealerFolder}/${stockNumber}, Unable to find image number: ${imageNumberToDownload}, Total images under page: ${imageOriginalURLS.length}.`
    //             )
    //         );
    //         // eslint-disable-next-line no-continue
    //         continue;
    //     }

    //     debug ? console.log(`Downloading image: ${imageOriginalURLS[imageNumberToDownload - 1]}`) : '';
    //     const file = fs.createWriteStream(`${tempPath}/${zeroPad(imageNumberToDownload, 3)}.jpg`);

    //     let shortFilename = '';
    //     if (imageNumbersToDownload.length === 1) {
    //         shortFilename = `${dealerFolder}/${stockNumber}${path.extname(path.basename(file.path))}`;
    //     } else {
    //         shortFilename = `${dealerFolder}/${stockNumber}/${path.basename(file.path)}`;
    //     }
    //     debug ? '' : process.stdout.write(chalk.white(`${shortFilename} »`));
    //     const shortFilenameTextLength = shortFilename.length + 2;

    //     let checksumOfFile;
    //     for (let checksumOfFileCnt = 0; checksumOfFileCnt < 5; checksumOfFileCnt++) {
    //         try {
    //             checksumOfFile = await getChecksumFromURL(imageOriginalURLS[imageNumberToDownload - 1], hashAlgo, debug);
    //             break;
    //         } catch (err) {
    //             if (
    //                 err.message.match(/Navigation timeout of \d* ms exceeded/g) ||
    //                 err.message.match(/net::ERR_CONNECTION_TIMED_OUT at .*/g) ||
    //                 err.message === 'socket hang up' ||
    //                 err.message === 'aborted' ||
    //                 err.message === 'read ECONNRESET'
    //             ) {
    //                 console.log(`SUCCESSFULLY ERROR HANDLED (WITHOUT HASH):#${err.message}#`);
    //                 process.stdout.write(chalk.yellow.bold(` ${logSymbols.warning}`));
    //                 if (checksumOfFileCnt < 4) {
    //                     // Sleep for 30 seconds
    //                     for (let cnt = 0; cnt < 10; cnt++) {
    //                         process.stdout.write(chalk.yellow.bold('.'));
    //                         await waitForSeconds(3);
    //                     }
    //                     incRetryCount();
    //                 } else {
    //                     console.log(
    //                         chalk.white.bgRed.bold(
    //                             `\nUnable to download the following file after 5 retries in interval of 30 seconds each, download operation timeout set to 15 seconds: ${shortFilename} .`
    //                         )
    //                     );
    //                     process.stdout.write('  ');
    //                 }
    //             } else {
    //                 console.log(`CATCH THIS ERROR (WITHOUT HASH):#${err.message}#`);
    //                 throw err;
    //             }
    //         }
    //     }
    //     if (checksumOfFile === undefined) {
    //         // eslint-disable-next-line no-continue
    //         continue;
    //     }

    //     for (let downloadCnt = 0; downloadCnt < 5; downloadCnt++) {
    //         try {
    //             await downloadFileAndCompareWithChecksum(
    //                 imageOriginalURLS[imageNumberToDownload - 1],
    //                 file,
    //                 tempPath,
    //                 `${config.downloadPath}/${todaysDate}/Lot_${zeroPad(lotIndex, 2)}/${usernameTrimmed}/${dealerFolder}/${stockNumber}/`,
    //                 imageNumbersToDownload.length === 1,
    //                 hashAlgo,
    //                 checksumOfFile,
    //                 shortFilenameTextLength,
    //                 debug
    //             );
    //             imagesDownloaded++;
    //             break;
    //         } catch (err) {
    //             if (
    //                 err.message.match(/Navigation timeout of \d* ms exceeded/g) ||
    //                 err.message.match(/net::ERR_CONNECTION_TIMED_OUT at .*/g) ||
    //                 err.message === 'socket hang up' ||
    //                 err.message === 'aborted' ||
    //                 err.message === 'read ECONNRESET'
    //             ) {
    //                 console.log(`SUCCESSFULLY ERROR HANDLED (WITHOUT HASH):#${err.message}#`);
    //                 process.stdout.write(chalk.yellow.bold(` ${logSymbols.warning}`));
    //                 if (downloadCnt < 4) {
    //                     // Sleep for 30 seconds
    //                     for (let cnt = 0; cnt < 10; cnt++) {
    //                         process.stdout.write(chalk.yellow.bold('.'));
    //                         await waitForSeconds(3);
    //                     }
    //                     incRetryCount();
    //                 } else {
    //                     console.log(
    //                         chalk.white.bgRed.bold(
    //                             `\nUnable to download the following file after 5 retries in interval of 30 seconds each, download operation timeout set to 15 seconds: ${shortFilename} .`
    //                         )
    //                     );
    //                     process.stdout.write('  ');
    //                 }
    //             } else {
    //                 console.log(`CATCH THIS ERROR (WITHOUT HASH):#${err.message}#`);
    //                 throw err;
    //             }
    //         }
    //     }
    // }
    // process.stdout.write(
    //     chalk.cyan.bgWhiteBright(
    //         `\nImages (Downloaded/Requested)  /Available: (${imagesDownloaded}/${imageNumbersToDownload.length})  /${imageOriginalURLS.length}         `
    //     )
    // );
    // debug ? '' : process.stdout.write('\n');
    // // TODO: Make sure this removeDir runs properly
    // removeDir(tempPath, true, debug);
    // return { result: true, bookmarkAppendMesg: stockNumber, imagesDownloaded: imagesDownloaded };
    return false;
}

// eslint-disable-next-line import/prefer-default-export
export { uploadBookmarkURL };
