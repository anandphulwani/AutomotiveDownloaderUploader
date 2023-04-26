import fs from 'fs';
import date from 'date-and-time';
import chalk from 'chalk';
import path from 'path';
import logSymbols from 'log-symbols';
import { URL as URLparser } from 'url';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
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
import { createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty } from './filesystem.js';
/* eslint-enable import/extensions */

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
async function uploadBookmarkURL(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, URL, debug = false) {
    const startingRow = await getRowPosOnTerminal();
    process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;

    for (let gotoIndex = 0; gotoIndex < 24; gotoIndex++) {
        let vehicleBookmarkUrlWOQueryParams = new URLparser(URL);
        vehicleBookmarkUrlWOQueryParams = vehicleBookmarkUrlWOQueryParams.host + vehicleBookmarkUrlWOQueryParams.pathname;

        let parsedCurrentUrlWOQueryParams = new URLparser(page.url());
        parsedCurrentUrlWOQueryParams = parsedCurrentUrlWOQueryParams.host + parsedCurrentUrlWOQueryParams.pathname;

        if (parsedCurrentUrlWOQueryParams !== vehicleBookmarkUrlWOQueryParams) {
            await gotoURL(page, URL, debug);
        }
        if (page.url().startsWith(`${getAppDomain()}/dashboard?`)) {
            debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
            debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
            debug ? '' : process.stdout.cursorTo(0);
            process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)\n`));
            const stockNumberFromBookmark = name.split(' |#| ')[1].trim();
            const { typeOfStockPath, stockFolderPath, stockFilePath } = typeOfStockPathAndOtherVars(uniqueIdFolderPath, stockNumberFromBookmark);
            const { moveSource, moveDestination } = getSourceAndDestinationFrom(
                typeOfStockPath,
                stockFolderPath,
                uniqueIdFolderPath,
                stockFilePath,
                true
            );
            await waitForSeconds(5);
            return {
                result: false,
                bookmarkAppendMesg: 'Ignoring (Does not Exist)',
                imagesUploaded: 0,
                moveSource: moveSource,
                moveDestination: moveDestination,
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

    const returnObj = await uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name);
    return returnObj;
}

async function uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, debug = false) {
    // console.log(uniqueIdElement);
    // console.log(dealerFolder);
    const imageNumbersToDownloadFromDC = getImageNumbersToDownloadFromDC(dealerFolder);
    const deleteOriginalFromDC = getDeleteOriginalFromDC(dealerFolder);
    const shiftOriginalFirstPositionToLastPositionFromDC = getShiftOriginalFirstPositionToLastPositionFromDC(dealerFolder);
    const putFirstPositionEditedImageInTheLastPositionAlsoFromDC = getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerFolder);
    const lockTheImagesCheckMarkFromDC = getLockTheImagesCheckMarkFromDC(dealerFolder);

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
        return { result: false, bookmarkAppendMesg: '', imagesUploaded: 0 };
    }
    /**
     * Get dealer name from excel and compare it with dealer name in the page: End
     */

    const stockNumberFromBookmark = name.split(' |#| ')[1].trim();
    const stockNumberFromWeb = String(
        await page.$$eval('input#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_VehicleHeader_StockNumber', (el) =>
            el.map((x) => x.getAttribute('value'))
        )
    );

    if (stockNumberFromBookmark !== stockNumberFromWeb) {
        console.log(
            chalk.white.bgYellow.bold(
                `\nWARNING: Stock Number values mismatch, name from web is '${stockNumberFromWeb}' vs name from bookmark is '${stockNumberFromBookmark}', Continuing.`
            )
        );
    }

    const { typeOfStockPath, stockFolderPath, stockFilePath } = typeOfStockPathAndOtherVars(uniqueIdFolderPath, stockNumberFromBookmark);

    if (typeOfStockPath === 'stockFolder' && !fs.existsSync(stockFolderPath)) {
        console.log(chalk.white.bgRed.bold(`Unable to upload file/folder for the stock number: ${stockNumberFromBookmark} .`));
        process.exit(1);
    }

    const imageDIVContainer = await page.$('.tn-list-container');
    const imageULContainer = await imageDIVContainer.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS = await imageULContainer.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength = imageOriginalURLS.length;

    if (!page.url().endsWith('#imagery')) {
        await clickOnButton(page, '.vehicle-detail-tab.vehicle-detail-tab-imagery');
        await waitTillCurrentURLEndsWith(page, '#imagery');
    }
    // console.log(`${uniqueIdFolderPath}\\${stockNumberFromBookmark}`);
    // console.log(imageNumbersToDownloadFromDC);

    // TODO: Total bookmarks number do not change while writing
    // TODO: Shift images into date folders in all zones
    // TODO: Get all the folders which have codein ReadyToUpload, pull them only in the UploadingZone, also give warning for folders which do not satisy this criteeria also give warning when imageQty doesnt matches
    // TODO: For bookmarks which are done or not found give warning and move forward
    // Done: Change variable for old images to just stay as there to be introduced in excel (No change required, if files are set to not delete, then keep files at the same place, only if shift paramater is there, shift 1st file to down, keep rest there itself.)
    // Done: Single image which is not in stock folder (use the path system rather than image number parseIntsystem)
    // Update bookmark when its done
    // Later: error handling if stuck delete all previous images and start again.

    /* #region: Uploading the files: Begin */
    let firstImage;
    const imagesToUpload = [];
    // eslint-disable-next-line no-useless-catch
    try {
        const stockFolderPathList = typeOfStockPath === 'stockFolder' ? fs.readdirSync(stockFolderPath) : [stockFilePath];
        // eslint-disable-next-line no-restricted-syntax
        for (const stockFolderSubFolderAndFiles of stockFolderPathList) {
            const stockFolderSubFolderAndFilesPath =
                typeOfStockPath === 'stockFolder'
                    ? path.join(stockFolderPath, stockFolderSubFolderAndFiles)
                    : path.join(uniqueIdFolderPath, stockFolderSubFolderAndFiles);
            if (firstImage === undefined) {
                firstImage = stockFolderSubFolderAndFiles;
            }
            const stockFolderSubFolderAndFilesStat = fs.statSync(stockFolderSubFolderAndFilesPath);

            if (stockFolderSubFolderAndFilesStat.isFile()) {
                await page.bringToFront();
                const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
                await fileChooser.accept([path.resolve(stockFolderSubFolderAndFilesPath)]);
                const session = await page.target().createCDPSession();
                const { windowId } = await session.send('Browser.getWindowForTarget');
                await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });
            }
            // console.log(stockFolderSubFolderAndFiles);
            // TODO: Folder still exists after picking from 000_ReadyToUpload, was a user fault earlier, but have to create a system to create a failsafe.
            let imageNumber;
            if (typeOfStockPath === 'stockFolder') {
                const fileNameWOExt = stockFolderSubFolderAndFiles.split('.')[0];
                imageNumber = parseInt(fileNameWOExt, 10);
            } else {
                imageNumber = 1;
            }
            imagesToUpload.push(imageNumber);
        }
        await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
        if (
            putFirstPositionEditedImageInTheLastPositionAlsoFromDC &&
            (imageNumbersToDownloadFromDC.length === 1 || (imageNumbersToDownloadFromDC.length > 1 && firstImage.startsWith('001.')))
        ) {
            await page.bringToFront();
            const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
            await fileChooser.accept([path.resolve(firstImagePath)]);
            const session = await page.target().createCDPSession();
            const { windowId } = await session.send('Browser.getWindowForTarget');
            await session.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'minimized' } });
        }
    } catch (error) {
        console.log(`error01: ${error}`);
    }
    await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
    // TODO: Verify all files are uploaded in qty, also rename bookmarks by giving quantity while download
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
                    console.log(`error02: ${error}`);
                    // eslint-disable-next-line no-continue
                    continue;
                }
                break;
            }
        }
    }
    /* #endregion: Delete the older files to replace with the newer files: End */

    const imageDIVContainer2 = await page.$('.tn-list-container');
    const imageULContainer2 = await imageDIVContainer2.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS2 = await imageULContainer2.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength2 = imageOriginalURLS2.length;

    /* #region: Move uploaded files on the correct location: Begin */
    // eslint-disable-next-line no-restricted-syntax
    for (let imageToUploadIndex = imagesToUpload.length; imageToUploadIndex > 0; imageToUploadIndex--) {
        if (
            putFirstPositionEditedImageInTheLastPositionAlsoFromDC &&
            (imageNumbersToDownloadFromDC.length === 1 || (imageNumbersToDownloadFromDC.length > 1 && firstImage.startsWith('001.')))
        ) {
            await moveImageToPositionNumber(
                page,
                imageOriginalURLSLength2,
                imageOriginalURLSLength2 - 1,
                imagesToUpload[imageToUploadIndex - 1],
                false
            );
        } else {
            await moveImageToPositionNumber(page, imageOriginalURLSLength2, imageOriginalURLSLength2, imagesToUpload[imageToUploadIndex - 1], false);
        }
    }
    /* #endregion: Move uploaded files on the correct location: End */

    /* #region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: Begin */
    if (shiftOriginalFirstPositionToLastPositionFromDC) {
        await moveImageToPositionNumber(page, imageOriginalURLSLength2, imagesToUpload[0] + 1, imageOriginalURLSLength2);
    }
    /* #endregion: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: End */

    /* #region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : Begin */
    const ImagesAreLockedFromWeb = await page.evaluate(
        // eslint-disable-next-line no-undef
        (selector) => document.querySelector(selector).checked,
        'input[type="checkbox"].vp[property-name="ImagesAreLocked"]'
    );
    // console.log(`Current ImagesAreLockedFromWeb: ${ImagesAreLockedFromWeb}`);

    if (lockTheImagesCheckMarkFromDC !== null && lockTheImagesCheckMarkFromDC !== ImagesAreLockedFromWeb) {
        clickOnButton(page, 'input[type="checkbox"].vp[property-name="ImagesAreLocked"]');
    }
    /* #endregion: Check/Uncheck the 'Lock The Images' checkbox, according to setting : End */

    // Bring save button to focus and move mouse over it.
    const saveButtonSelector = `#aspnetForm > div.canvas.standard-canvas.viewport > div.canvas-body.canvas-body-no-padding.container > div > div.vehicle-details-body.container > div.vehicle-actions > ul:nth-child(2) > li:nth-child(3) > a`;
    const saveButtonElement = await page.waitForSelector(saveButtonSelector);

    await page.evaluate((element) => element.scrollIntoView(), saveButtonElement);
    await page.waitForFunction(
        (element) => {
            const { top, bottom } = element.getBoundingClientRect();
            // eslint-disable-next-line no-undef
            const viewportHeight = window.innerHeight;
            return top >= 0 && bottom <= viewportHeight;
        },
        {},
        saveButtonElement
    );

    const saveButtonElementRect = await page.evaluate((el) => {
        const { x, y, width, height } = el.getBoundingClientRect();
        return { x, y, width, height };
    }, saveButtonElement);

    if (config.automaticClickSaveButtonOnUpload) {
        await clickOnButton(page, saveButtonSelector);
    } else {
        await page.mouse.move(saveButtonElementRect.x + saveButtonElementRect.width / 2, saveButtonElementRect.y + saveButtonElementRect.height / 2, {
            steps: 1,
        });
    }
    await page.waitForNavigation({ timeout: 300000 });
    const { moveSource, moveDestination } = getSourceAndDestinationFrom(typeOfStockPath, stockFolderPath, uniqueIdFolderPath, stockFilePath, false);
    fs.appendFileSync(logFile, `returning True\r\n`);
    return { result: true, bookmarkAppendMesg: '', imagesUploaded: 0, moveSource: moveSource, moveDestination: moveDestination };
}

async function moveImageToPositionNumber(page, totalImages, fromPosition, toPosition, isSlow = false, debug = true) {
    try {
        fromPosition = parseInt(fromPosition, 10);
        toPosition = parseInt(toPosition, 10);
        const imagesULSelector =
            '#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_ImagerySection_ctl01_ctl00 > div.dealer-images > div.tn-list-container > ul';
        const fromPositionIdSelector = `${imagesULSelector} > li:nth-child(${zeroPad(fromPosition, 2)})`;
        const toPositionIdSelector = `${imagesULSelector} > li:nth-child(${zeroPad(toPosition, 2)})`;

        const fromPositionElement = await page.waitForSelector(fromPositionIdSelector);
        const toPositionElement = await page.waitForSelector(toPositionIdSelector);

        const fromPositionSubImageSelector = `${fromPositionIdSelector} > div > img`;
        const toPositionSubImageSelector = `${toPositionIdSelector} > div > img`;

        const fromPositionSubImageVehicleId = await page.$eval(
            fromPositionSubImageSelector,
            (element, attr) => element.getAttribute(attr),
            'vehicleid'
        );
        const toPositionSubImageVehicleId = await page.$eval(toPositionSubImageSelector, (element, attr) => element.getAttribute(attr), 'vehicleid');

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
        isSlow ? await waitForSeconds(3, true) : '';

        const fromPositionElementRect = await page.evaluate((el) => {
            const { x, y, width, height } = el.getBoundingClientRect();
            return { x, y, width, height };
        }, fromPositionElement);

        while (true) {
            await page.mouse.move(
                fromPositionElementRect.x + fromPositionElementRect.width / 2,
                fromPositionElementRect.y + fromPositionElementRect.height / 2,
                { steps: 1 }
            );
            await page.mouse.down();
            await page.mouse.move(
                fromPositionElementRect.x + fromPositionElementRect.width / 2 + 5,
                fromPositionElementRect.y + fromPositionElementRect.height / 2 + 5,
                { steps: 1 }
            );
            // eslint-disable-next-line no-loop-func
            const opacity = await page.evaluate((fromPositionIdSel) => {
                // eslint-disable-next-line no-undef
                const element = document.querySelector(fromPositionIdSel);
                // eslint-disable-next-line no-undef
                const style = window.getComputedStyle(element);
                return style.getPropertyValue('opacity');
            }, fromPositionIdSelector);
            if (opacity === '0.6') {
                break;
            } else {
                // console.log(`opacity: ${opacity} is still not 0.6, so sleeping for 350ms.`);
                msleep(50);
                await page.mouse.up();
                msleep(300);
            }
        }
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
        let oldToPositionElementRectX;
        for (let lastIndex = 0; lastIndex <= 100; lastIndex++) {
            const toPositionElementRect = await page.evaluate((el) => {
                const { x, y, width, height } = el.getBoundingClientRect();
                return { x, y, width, height };
            }, toPositionElement);
            if (oldToPositionElementRectX !== undefined && Math.abs(toPositionElementRect.x - oldToPositionElementRectX) > 50) {
                const currToPositionPrevIdSelector =
                    toPosition !== 1
                        ? `${imagesULSelector} > li:nth-child(${zeroPad(fromPosition < toPosition ? toPosition : toPosition - 1, 2)})`
                        : false;
                const currToPositionNextIdSelector =
                    totalImages !== toPosition
                        ? `${imagesULSelector} > li:nth-child(${zeroPad(fromPosition < toPosition ? toPosition + 2 : toPosition + 1, 2)})`
                        : false;
                const currToPositionPrevSubImageVehicleId =
                    currToPositionPrevIdSelector !== false
                        ? await page.$eval(`${currToPositionPrevIdSelector} > div > img`, (element, attr) => element.getAttribute(attr), 'vehicleid')
                        : false;
                const currToPositionNextSubImageVehicleId =
                    currToPositionNextIdSelector !== false
                        ? await page.$eval(`${currToPositionNextIdSelector} > div > img`, (element, attr) => element.getAttribute(attr), 'vehicleid')
                        : false;

                if (
                    (fromPosition > toPosition && toPositionSubImageVehicleId === currToPositionNextSubImageVehicleId) ||
                    (fromPosition < toPosition && toPositionSubImageVehicleId === currToPositionPrevSubImageVehicleId)
                ) {
                    await page.mouse.up();
                    msleep(10);

                    const currToPositionSubImageVehicleId = await page.$eval(
                        toPositionSubImageSelector,
                        (element, attr) => element.getAttribute(attr),
                        'vehicleid'
                    );
                    // console.log('4');
                    if (fromPositionSubImageVehicleId === currToPositionSubImageVehicleId) {
                        // console.log(`breaking now ${oldToPositionElementRectX} > ${toPositionElementRect.x}`);
                        break;
                    } else {
                        // console.log('-------------------------Var Start---------------------');
                        // console.log(`${fromPositionSubImageVehicleId} , ${currToPositionSubImageVehicleId}`);
                        // console.log(`${fromPosition} > ${toPosition} ${toPositionSubImageVehicleId} === ${currToPositionNextSubImageVehicleId}`);
                        // console.log(`${fromPosition} < ${toPosition} ${toPositionSubImageVehicleId} === ${currToPositionPrevSubImageVehicleId}`);
                        // console.log('-------------------------Var End---------------------');
                        console.log(
                            chalk.white.bgRed.bold(
                                `Image position changed, but the 'vechileId' from 'fromPositionSubImageVehicleId' and 'currToPositionSubImageVehicleId' doesn't match.`
                            )
                        );
                        await waitForSeconds(240, true);
                        process.exit(1);
                    }
                } else {
                    console.log(chalk.white.bgRed.bold(`Image position changed, but the 'vechileId' from previous/next doesn't match.`));
                    await waitForSeconds(240, true);
                    process.exit(1);
                }
            }

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
                        toPositionElementRect.x + toPositionElementRect.width / 2 - lastIndex,
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
            msleep(10);
            isSlow ? await waitForSeconds(1, true) : '';
            oldToPositionElementRectX = toPositionElementRect.x;
            if (lastIndex === 100) {
                console.log(chalk.white.bgRed.bold(`Tried changing image position for 100 iterations, but it didn't work.`));
                process.exit(1);
            }
        }
        isSlow ? await waitForSeconds(6, true) : '';
    } catch (error) {
        // throw error;
        console.log(`handled this:${error}`);
        await waitForSeconds(240, true);
    }
}

function typeOfStockPathAndOtherVars(uniqueIdFolderPath, stockNumberFromBookmark) {
    const stockFolderPath = `${uniqueIdFolderPath}\\${stockNumberFromBookmark}`;
    let stockFilePath = fs.readdirSync(uniqueIdFolderPath).filter((file) => file.startsWith(`${stockNumberFromBookmark}.`));
    stockFilePath = stockFilePath.length === 1 ? stockFilePath[0] : undefined;
    const typeOfStockPath = stockFilePath === undefined ? 'stockFolder' : 'stockFile';
    return { typeOfStockPath: typeOfStockPath, stockFolderPath: stockFolderPath, stockFilePath: stockFilePath };
}

function getSourceAndDestinationFrom(typeOfStockPath, stockFolderPath, uniqueIdFolderPath, stockFilePath, isURLDoesNotExist) {
    let moveSource;
    let moveDestination;
    if (typeOfStockPath === 'stockFolder') {
        fs.appendFileSync(logFile, `stockFolderPath\\: ${stockFolderPath}\\\r\n`);
        // console.log(`${stockFolderPath}\\`);
        fs.appendFileSync(
            logFile,
            `config.finishedUploadingZonePath\\todaysDate\\path.basename(path.dirname(stockFolderPath)\\path.basename(stockFolderPath): ${
                config.finishedUploadingZonePath
            }\\${isURLDoesNotExist ? 'DeletedURLs\\' : ''}${todaysDate}\\${path.basename(path.dirname(stockFolderPath))}\\${path.basename(
                stockFolderPath
            )}`
        );
        // console.log(`${config.finishedUploadingZonePath}\\${todaysDate}\\${path.basename(path.dirname(stockFolderPath))}\\${path.basename(stockFolderPath)}`);
        moveSource = `${stockFolderPath}\\`;
        moveDestination = `${config.finishedUploadingZonePath}\\${isURLDoesNotExist ? 'DeletedURLs\\' : ''}${todaysDate}\\${path.basename(
            path.dirname(stockFolderPath)
        )}\\${path.basename(stockFolderPath)}`;
    } else {
        moveSource = `${uniqueIdFolderPath}\\${stockFilePath}`;
        moveDestination = `${config.finishedUploadingZonePath}\\${isURLDoesNotExist ? 'DeletedURLs\\' : ''}${todaysDate}\\${path.basename(
            uniqueIdFolderPath
        )}\\${stockFilePath}`;
    }
    return { moveSource: moveSource, moveDestination: moveDestination };
}

// eslint-disable-next-line import/prefer-default-export
export { uploadBookmarkURL };
