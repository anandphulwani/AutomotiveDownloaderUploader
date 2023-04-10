import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { sleep, msleep, waitForSeconds } from './sleep.js';
import { enableAndClickOnButton, clickOnButton } from './actionOnElements.js';
import {
    getDealerNameFromDCAsIs,
    getImageNumbersToDownloadFromDC,
    getDeleteOriginalFromDC,
    getShiftOriginalFirstPositionToLastPositionFromDC,
    getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC,
    getLockTheImagesCheckMarkFromDC,
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
    const imageNumbersToDownloadFromDC = getImageNumbersToDownloadFromDC(dealerFolder);
    // const deleteOriginalFromDC = getDeleteOriginalFromDC(dealerFolder);
    // const shiftOriginalFirstPositionToLastPositionFromDC = getShiftOriginalFirstPositionToLastPositionFromDC(dealerFolder);
    // const putFirstPositionEditedImageInTheLastPositionAlsoFromDC = getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerFolder);
    // const lockTheImagesCheckMarkFromDC = getLockTheImagesCheckMarkFromDC(dealerFolder);
    let deleteOriginalFromDC = getDeleteOriginalFromDC(dealerFolder);
    let shiftOriginalFirstPositionToLastPositionFromDC = getShiftOriginalFirstPositionToLastPositionFromDC(dealerFolder);
    let putFirstPositionEditedImageInTheLastPositionAlsoFromDC = getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerFolder);
    let lockTheImagesCheckMarkFromDC = getLockTheImagesCheckMarkFromDC(dealerFolder);

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
    // console.log(`${uniqueIdFolderPath}\\${stockNumber}`);
    // console.log(imageNumbersToDownloadFromDC);

    deleteOriginalFromDC = true;
    shiftOriginalFirstPositionToLastPositionFromDC = true;
    putFirstPositionEditedImageInTheLastPositionAlsoFromDC = false;
    // lockTheImagesCheckMarkFromDC = true;

    // deleteOriginalFromDC
    // Done: shiftOriginalFirstPositionToLastPositionFromDC: If deletingOriginal is set to yes and then is set to yes, avoid deleting the first image, but if deletingOriginal is set to no, this setting is of no use as all the image will be shifted below.
    // Done: putFirstPositionEditedImageInTheLastPositionAlsoFromDC: If the uploading images set doesnt start with 001, this wont do anything

    /* #region: Uploading the files: Begin */
    const imagesToUpload = [];
    // eslint-disable-next-line no-useless-catch
    try {
        let firstImage;
        // eslint-disable-next-line no-restricted-syntax
        for (const stockFolderSubFolderAndFiles of fs.readdirSync(stockFolderPath)) {
            const stockFolderSubFolderAndFilesPath = path.join(stockFolderPath, stockFolderSubFolderAndFiles);
            if (firstImage === undefined) {
                firstImage = stockFolderSubFolderAndFilesPath;
            }
            const stockFolderSubFolderAndFilesStat = fs.statSync(stockFolderSubFolderAndFilesPath);

            if (stockFolderSubFolderAndFilesStat.isFile()) {
                // console.log(uploadingZoneSubFolderPath);
                const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
                await fileChooser.accept([path.resolve(stockFolderSubFolderAndFilesPath)]);
            }
            // console.log(stockFolderSubFolderAndFiles);
            const imageNumber = parseInt(stockFolderSubFolderAndFiles.split('.')[0], 10);
            imagesToUpload.push(imageNumber);
        }
        await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
        if (
            putFirstPositionEditedImageInTheLastPositionAlsoFromDC &&
            (imageNumbersToDownloadFromDC.length === 1 || (imageNumbersToDownloadFromDC.length > 1 && firstImage.startsWith('001.')))
        ) {
            const firstImagePath = path.join(stockFolderPath, firstImage);
            const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
            await fileChooser.accept([path.resolve(firstImagePath)]);
        }
    } catch (error) {
        console.log(`error01:${error}`);
    }
    await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
    /* #endregion: Uploading the files: End */

    /* #region: Mark file to delete the older files to replace with the newer files: Begin */
    if (deleteOriginalFromDC) {
        // eslint-disable-next-line no-restricted-syntax
        for (const imageToUpload of imagesToUpload) {
            if (shiftOriginalFirstPositionToLastPositionFromDC && imageToUpload === 1) {
                // eslint-disable-next-line no-continue
                continue;
            }
            // eslint-disable-next-line no-constant-condition
            while (true) {
                try {
                    const deleteId = `#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_ImagerySection_ctl01_ctl00_RepeaterTNImages_ctl${zeroPad(
                        imageToUpload - 1,
                        2
                    )}_Img1`;
                    await enableAndClickOnButton(page, deleteId);

                    await page.waitForFunction(
                        // eslint-disable-next-line no-loop-func
                        (selector, attributeName, expectedValue) => {
                            // eslint-disable-next-line no-undef
                            const element = document.querySelector(selector);
                            if (element) {
                                return element.getAttribute(attributeName) === expectedValue;
                            }
                            return false;
                        },
                        {},
                        deleteId,
                        'title',
                        'click to RESTORE this photo.'
                    );
                } catch (error) {
                    // eslint-disable-next-line no-continue
                    continue;
                }
                break;
            }
        }
    }
    /* #endregion: Delete the older files to replace with the newer files: End */

    await waitForSeconds(5, true);

    const imageDIVContainer2 = await page.$('.tn-list-container');
    const imageULContainer2 = await imageDIVContainer2.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS2 = await imageULContainer2.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength2 = imageOriginalURLS2.length;
    console.log(`imageOriginalURLSLength2: ${imageOriginalURLSLength2}`);

    // // eslint-disable-next-line no-restricted-syntax
    // for (let imageToUploadIndex = 0; imageToUploadIndex < imagesToUpload.length; imageToUploadIndex++) {
    //     console.log(`Moving image from ${'1'} To ${imageOriginalURLSLength + imagesToUpload[imageToUploadIndex]}`);
    //     await moveImageToPositionNumber(page, 1, imageOriginalURLSLength + imagesToUpload[imageToUploadIndex]);
    //     // await waitForSeconds(10, true);
    // }
    // await waitForSeconds(60, true);
    // process.exit(0);

    // eslint-disable-next-line no-restricted-syntax
    for (let imageToUploadIndex = imagesToUpload.length; imageToUploadIndex > 0; imageToUploadIndex--) {
        console.log(`Moving image from ${imageOriginalURLSLength2} To ${imagesToUpload[imageToUploadIndex - 1] + 1}`);
        // await moveImageToPositionNumber(page, imageOriginalURLSLength2, imagesToUpload[imageToUploadIndex - 1] + 1);
    }

    /* #region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: Begin */
    // eslint-disable-next-line no-restricted-syntax
    for (let imageToUploadIndex = imagesToUpload.length; imageToUploadIndex > 0; imageToUploadIndex--) {
        // If 'deleteOriginalFromDC' is set to true and 'shiftOriginalFirstPositionToLastPositionFromDC' is set to false, dont shift anything and break
        if (deleteOriginalFromDC && !shiftOriginalFirstPositionToLastPositionFromDC) {
            break;
        }
        // If 'deleteOriginalFromDC' is set to true and 'shiftOriginalFirstPositionToLastPositionFromDC' is set to true, just shift first image and then break
        if (deleteOriginalFromDC && shiftOriginalFirstPositionToLastPositionFromDC && imageToUploadIndex === 1) {
            break;
        }
        // if (deleteOriginalFromDC) {
        //     /* #region: Shift original first image from first position to last position, according to setting : Begin */
        //     if (shiftOriginalFirstPositionToLastPositionFromDC) {
        //         console.log(`Moving image from ${'1'} To ${imageOriginalURLSLength2}`);
        //         moveImageToPositionNumber(page, 1, imageOriginalURLSLength2);
        //     }
        //     /* #endregion: Shift original first image from first position to last position, according to setting : End */
        //     break;
        // }
        console.log(`Moving image from ${imageOriginalURLSLength2} To ${imagesToUpload[imageToUploadIndex - 1] + 1}`);
        await moveImageToPositionNumber(page, imageOriginalURLSLength2, imagesToUpload[imageToUploadIndex - 1] + 1);
    }
    /* #endregion: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: End */

    /* #region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : Begin */
    const ImagesAreLockedFromWeb = await page.evaluate(
        // eslint-disable-next-line no-undef
        (selector) => document.querySelector(selector).checked,
        'input[type="checkbox"].vp[property-name="ImagesAreLocked"]'
    );
    console.log(`Current ImagesAreLockedFromWeb: ${ImagesAreLockedFromWeb}`);

    if (ImagesAreLockedFromWeb !== lockTheImagesCheckMarkFromDC) {
        clickOnButton(page, 'input[type="checkbox"].vp[property-name="ImagesAreLocked"]');
    }
    /* #endregion: Check/Uncheck the 'Lock The Images' checkbox, according to setting : End */

    await waitForSeconds(240, true);
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

async function moveImageToPositionNumber(page, fromPosition, toPosition, isSlow = false, debug = true) {
    try {
        fromPosition = parseInt(fromPosition, 10);
        toPosition = parseInt(toPosition, 10);
        const fromPositionIdSelector = `#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_ImagerySection_ctl01_ctl00 > div.dealer-images > div.tn-list-container > ul > li:nth-child(${zeroPad(
            fromPosition,
            2
        )})`;
        const toPositionIdSelector = `#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_ImagerySection_ctl01_ctl00 > div.dealer-images > div.tn-list-container > ul > li:nth-child(${zeroPad(
            toPosition,
            2
        )})`;

        const fromPositionElement = await page.waitForSelector(fromPositionIdSelector);
        const toPositionElement = await page.waitForSelector(toPositionIdSelector);

        await page.evaluate((element) => element.scrollIntoView(), fromPositionElement);
        await page.waitForFunction(
            (element) => {
                const { top, bottom } = element.getBoundingClientRect();
                // eslint-disable-next-line no-undef
                const viewportHeight = window.innerHeight;
                return top >= 0 && bottom <= viewportHeight;
            },
            {},
            fromPositionElement
        );
        // await waitForSeconds(3, true);

        const fromPositionElementRect = await page.evaluate((el) => {
            const { x, y, width, height } = el.getBoundingClientRect();
            return { x, y, width, height };
        }, fromPositionElement);

        await page.mouse.move(
            fromPositionElementRect.x + fromPositionElementRect.width / 2,
            fromPositionElementRect.y + fromPositionElementRect.height / 2,
            { steps: 1 }
        );
        await page.mouse.down();
        isSlow ? await waitForSeconds(4, true) : '';

        await page.evaluate((element) => element.scrollIntoView(), toPositionElement);
        await page.waitForFunction(
            (element) => {
                const { top, bottom } = element.getBoundingClientRect();
                // eslint-disable-next-line no-undef
                const viewportHeight = window.innerHeight;
                return top >= 0 && bottom <= viewportHeight;
            },
            {},
            toPositionElement
        );
        isSlow ? await waitForSeconds(5, true) : '';

        //
        //
        //
        //
        //
        let oldToPositionElementRectX;
        for (let lastIndex = 0; lastIndex < 10; lastIndex++) {
            const toPositionElementRect = await page.evaluate((el) => {
                const { x, y, width, height } = el.getBoundingClientRect();
                return { x, y, width, height };
            }, toPositionElement);
            if (oldToPositionElementRectX !== undefined && Math.abs(toPositionElementRect.x - oldToPositionElementRectX) > 50) {
                // console.log(`breaking now ${oldToPositionElementRectX} > ${toPositionElementRect.x}`);
                break;
            }
            msleep(10);

            // console.log(`To Position Of Element: X:${toPositionElementRect.x}`); // , Y:${toPositionElementRect.y}`);
            // console.log(
            //     chalk.yellowBright(`Moving Element To:        X:${toPositionElementRect.x + lastIndex}`) // , Y:${toPositionElementRect.y + 35}`)
            // );
            if (fromPosition > toPosition) {
                // Coming from down to up
                // console.log(`toPosition: ${toPosition},        (toPosition + 1) % 5 :  ${(toPosition + 1) % 5}`);
                if ((toPosition + 1) % 5 === 1) {
                    await page.mouse.move(
                        toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex,
                        toPositionElementRect.y + toPositionElementRect.height / 2, // + 10
                        { steps: 1 }
                    );
                } else {
                    await page.mouse.move(
                        toPositionElementRect.x + toPositionElementRect.width / 2 + lastIndex,
                        toPositionElementRect.y + toPositionElementRect.height / 2, // + 10
                        { steps: 1 }
                    );
                }
            } else {
                // Coming from up to down
                // console.log(`toPosition: ${toPosition},        (toPosition + 1) % 5 :  ${(toPosition + 1) % 5}`);
                // eslint-disable-next-line no-lonely-if
                if ((toPosition + 1) % 5 === 1) {
                    // console.log('Moving to the end of the row');
                    await page.mouse.move(
                        toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex,
                        toPositionElementRect.y + toPositionElementRect.height / 2, // + 10
                        { steps: 1 }
                    );
                } else {
                    await page.mouse.move(
                        toPositionElementRect.x + toPositionElementRect.width / 2 + lastIndex,
                        toPositionElementRect.y + toPositionElementRect.height / 2, // + 10
                        { steps: 1 }
                    );
                }
            }
            isSlow ? await waitForSeconds(1, true) : '';
            oldToPositionElementRectX = toPositionElementRect.x;
        }
        // await waitForSeconds(2, true);
        await page.mouse.up();
        isSlow ? await waitForSeconds(6, true) : '';
    } catch (error) {
        console.log(`handled this:${error}`);
        await waitForSeconds(240, true);
    }
}

// eslint-disable-next-line import/prefer-default-export
export { uploadBookmarkURL };
