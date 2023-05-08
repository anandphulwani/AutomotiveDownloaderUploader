import fs from 'fs';
import date from 'date-and-time';
import chalk from 'chalk';
import path from 'path';
import logSymbols from 'log-symbols';
import { URL as URLparser } from 'url';

/* eslint-disable import/extensions */
import { lgc, lgu, lge, lgw, lgi, lgcf, lgef, lgwf, lgif } from './loggersupportive.js';
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

const printToLogBuffer = [];
const todaysDate = date.format(new Date(), 'YYYY-MM-DD');

async function uploadBookmarkURL(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, URL, debug = false) {
    lgif(
        `fn uploadBookmarkURL() : BEGIN, Params: page: OBJECT, uniqueIdElement: ${uniqueIdElement}, uniqueIdFolderPath: ${uniqueIdFolderPath}, dealerFolder: ${dealerFolder}, name: ${name}, URL: ${URL}, debug: ${debug}`
    );
    const startingRow = await getRowPosOnTerminal();
    process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
    printToLogBuffer.push(`\${name} : \${URL}  :   ${name} : ${URL}`);
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;

    let vehicleBookmarkUrlWOQueryParams = new URLparser(URL);
    vehicleBookmarkUrlWOQueryParams = vehicleBookmarkUrlWOQueryParams.host + vehicleBookmarkUrlWOQueryParams.pathname;

    let parsedCurrentUrlWOQueryParams = new URLparser(page.url());
    parsedCurrentUrlWOQueryParams = parsedCurrentUrlWOQueryParams.host + parsedCurrentUrlWOQueryParams.pathname;

    lgif(`vehicleBookmarkUrlWOQueryParams: ${vehicleBookmarkUrlWOQueryParams}, parsedCurrentUrlWOQueryParams: ${parsedCurrentUrlWOQueryParams}`);
    if (parsedCurrentUrlWOQueryParams !== vehicleBookmarkUrlWOQueryParams) {
        await gotoURL(page, URL, debug);
    }
    if (page.url().startsWith(`${getAppDomain()}/dashboard?`)) {
        debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
        debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
        debug ? '' : process.stdout.cursorTo(0);
        printToLogBuffer.pop();
        lgef(`${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)`);
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
        const returnObj = {
            result: false,
            bookmarkAppendMesg: 'Ignoring (Does not Exist)',
            imagesUploaded: 0,
            moveSource: moveSource,
            moveDestination: moveDestination,
        };
        lgif(`fn uploadBookmarkURL() : END( From: Supplied URL doesn't exist ...... (Ignoring)), Returning: returnObj: ${JSON.stringify(returnObj)}`);
        return returnObj;
    }
    printToLogBuffer.map((value) => {
        lgif(value);
        return undefined;
    });

    const returnObj = await uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name);
    lgif(`fn uploadBookmarkURL() : END, Returning: returnObj: ${JSON.stringify(returnObj)}`);
    return returnObj;
}

async function uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, debug = false) {
    lgif(`fn uploadImagesFromFolder: Begin : (${uniqueIdElement}, ${uniqueIdFolderPath}, ${dealerFolder}, ${name}, ${debug})`);
    const imageNumbersToDownloadFromDC = getImageNumbersToDownloadFromDC(dealerFolder);
    const deleteOriginalFromDC = getDeleteOriginalFromDC(dealerFolder);
    const shiftOriginalFirstPositionToLastPositionFromDC = getShiftOriginalFirstPositionToLastPositionFromDC(dealerFolder);
    const putFirstPositionEditedImageInTheLastPositionAlsoFromDC = getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerFolder);
    const lockTheImagesCheckMarkFromDC = getLockTheImagesCheckMarkFromDC(dealerFolder);

    lgif(
        `Parameters from excel: imageNumbersToDownloadFromDC: ${imageNumbersToDownloadFromDC}, deleteOriginalFromDC: ${deleteOriginalFromDC}, shiftOriginalFirstPositionToLastPositionFromDC: ${shiftOriginalFirstPositionToLastPositionFromDC}, putFirstPositionEditedImageInTheLastPositionAlsoFromDC: ${putFirstPositionEditedImageInTheLastPositionAlsoFromDC}, lockTheImagesCheckMarkFromDC: ${lockTheImagesCheckMarkFromDC},`
    );

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
        lgw(`Dealer folder: ${dealerFolder} name mismatch, name from web is '${dealerNameFromPage}' vs excel is '${dealerNameFromDCAsIs}'.`);
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
        lgw(
            `Stock Number values mismatch, name from web is '${stockNumberFromWeb}' vs name from bookmark is '${stockNumberFromBookmark}', Continuing.`
        );
    }

    const { typeOfStockPath, stockFolderPath, stockFilePath } = typeOfStockPathAndOtherVars(uniqueIdFolderPath, stockNumberFromBookmark);

    if (typeOfStockPath === 'stockFolder' && !fs.existsSync(stockFolderPath)) {
        lge(`Unable to find file/folder for the stock number: ${stockNumberFromBookmark} on the disk, data does not exist.`);
        return { result: false, bookmarkAppendMesg: '', imagesUploaded: 0 };
    }

    const imageDIVContainer = await page.$('.tn-list-container');
    const imageULContainer = await imageDIVContainer.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS = await imageULContainer.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength = imageOriginalURLS.length;

    if (!page.url().endsWith('#imagery')) {
        await clickOnButton(page, '.vehicle-detail-tab.vehicle-detail-tab-imagery');
        await waitTillCurrentURLEndsWith(page, '#imagery');
    }
    lgif(`uniqueIdFolderPath\\stockNumberFromBookmark: ${uniqueIdFolderPath}\\${stockNumberFromBookmark}`);

    // TODO: Total bookmarks number do not change while writing
    // TODO: Shift images into date folders in all zones
    // TODO: Get all the folders which have codein ReadyToUpload, pull them only in the UploadingZone, also give warning for folders which do not satisy this criteeria also give warning when imageQty doesnt matches
    // TODO: For bookmarks which are done or not found give warning and move forward
    // Done: Change variable for old images to just stay as there to be introduced in excel (No change required, if files are set to not delete, then keep files at the same place, only if shift paramater is there, shift 1st file to down, keep rest there itself.)
    // Done: Single image which is not in stock folder (use the path system rather than image number parseIntsystem)
    // Update bookmark when its done
    // Later: error handling if stuck delete all previous images and start again.

    process.stdout.write(chalk.cyan(` Uploading Files: `));

    /* #region: Uploading the files: Begin */
    lgif(`region: Uploading the files: Begin`);
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
            lgif(
                `stockFolderSubFolderAndFiles: ${stockFolderSubFolderAndFiles}, stockFolderSubFolderAndFilesPath: ${stockFolderSubFolderAndFilesPath}`
            );
            const stockFolderSubFolderAndFilesStat = fs.statSync(stockFolderSubFolderAndFilesPath);

            if (stockFolderSubFolderAndFilesStat.isFile()) {
                lgif(`It is a stockFile.`);
                await page.bringToFront();
                const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
                await fileChooser.accept([path.resolve(stockFolderSubFolderAndFilesPath)]);
            }
            // TODO: Folder still exists after picking from 000_ReadyToUpload, was a user fault earlier, but have to create a system to create a failsafe.
            let imageNumber;
            if (typeOfStockPath === 'stockFolder') {
                const fileNameWOExt = stockFolderSubFolderAndFiles.split('.')[0];
                imageNumber = parseInt(fileNameWOExt, 10);
            } else {
                imageNumber = 1;
            }
            lgif(`imagesToUpload.push(imageNumber: ${imageNumber})`);
            imagesToUpload.push(imageNumber);
        }
        await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
        lgif(`putFirstPositionEditedImageInTheLastPositionAlsoFromDC: ${putFirstPositionEditedImageInTheLastPositionAlsoFromDC}`);
        lgif(
            `imageNumbersToDownloadFromDC.length === 1: ${imageNumbersToDownloadFromDC.length === 1}, imageNumbersToDownloadFromDC.length: ${
                imageNumbersToDownloadFromDC.length
            }`
        );
        lgif(
            `imageNumbersToDownloadFromDC.length > 1 ${
                imageNumbersToDownloadFromDC.length > 1
            }, firstImage.startsWith('001.'): ${firstImage.startsWith('001.')}, imageNumbersToDownloadFromDC.length ${
                imageNumbersToDownloadFromDC.length
            }, firstImage ${firstImage}`
        );
        if (
            putFirstPositionEditedImageInTheLastPositionAlsoFromDC &&
            (imageNumbersToDownloadFromDC.length === 1 || (imageNumbersToDownloadFromDC.length > 1 && firstImage.startsWith('001.')))
        ) {
            lgif(`Uploading a copy now`);
            await page.bringToFront();
            const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
            await fileChooser.accept([path.resolve(firstImagePath)]);
        }
    } catch (error) {
        lgc(`region: Uploading the files, Try Error: `, error);
    }
    await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', true);
    lgif(`region: Uploading the files: End`);
    // TODO: Verify all files are uploaded in qty, also rename bookmarks by giving quantity while download
    /* #endregion: Uploading the files: End */

    process.stdout.write(chalk.green.bold(`${logSymbols.success}${' '.repeat(6)}`));
    process.stdout.write(chalk.cyan(` Mark Deletion: `));

    /* #region: Mark file to delete the older files so as to replace with the newer files later on: Begin */
    lgif(`region: Mark file to delete the older files so as to replace with the newer files later on: Begin`);
    if (deleteOriginalFromDC) {
        lgif(`deleteOriginalFromDC is set to True: ${deleteOriginalFromDC}`);
        // eslint-disable-next-line no-restricted-syntax
        for (const imageToUpload of imagesToUpload) {
            if (shiftOriginalFirstPositionToLastPositionFromDC && imageToUpload === 1) {
                lgif(
                    `shiftOriginalFirstPositionToLastPositionFromDC && imageToUpload === 1, continuing for next loop, imageToUpload: ${imageToUpload}`
                );
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
                    lgif(`waiting for enableAndClickOnButton on ${imageToUpload}`);
                    await enableAndClickOnButton(page, deleteId);

                    lgif(`waiting for delete to be set`);
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
                    lgif(`deletion set`);
                } catch (error) {
                    lgc(`region: Mark file to delete the older files so as to replace with the newer files later on, Try Error: `, error);
                    // eslint-disable-next-line no-continue
                    continue;
                }
                break;
            }
        }
    }
    lgif(`imagesToUpload at Delete: ${imagesToUpload}`);
    lgif(`region: Mark file to delete the older files so as to replace with the newer files later on: End`);
    /* #endregion: Delete the older files to replace with the newer files: End */

    process.stdout.write(chalk.green.bold(`${logSymbols.success}${' '.repeat(13)}`));
    process.stdout.write(chalk.cyan(` Move Files To Location: `));

    const imageDIVContainer2 = await page.$('.tn-list-container');
    const imageULContainer2 = await imageDIVContainer2.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS2 = await imageULContainer2.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength2 = imageOriginalURLS2.length;

    /* #region: Move uploaded files on the correct location: Begin */
    lgif(`region: Move uploaded files on the correct location: Begin`);
    lgif(`imagesToUpload before move: ${imagesToUpload}`);
    lgif(`Moving uploaded files section: Start`);
    // eslint-disable-next-line no-restricted-syntax
    for (let imageToUploadIndex = imagesToUpload.length; imageToUploadIndex > 0; imageToUploadIndex--) {
        if (
            putFirstPositionEditedImageInTheLastPositionAlsoFromDC &&
            (imageNumbersToDownloadFromDC.length === 1 || (imageNumbersToDownloadFromDC.length > 1 && firstImage.startsWith('001.')))
        ) {
            lgif(`Loop 01 If`);
            lgif(
                `imageToUploadIndex: ${imageToUploadIndex}, imageToUploadIndex - 1: ${
                    imageToUploadIndex - 1
                }, imagesToUpload[imageToUploadIndex - 1]: ${imagesToUpload[imageToUploadIndex - 1]}`
            );
            lgif(`Moving image from ${imageOriginalURLSLength2 - 1} To ${imagesToUpload[imageToUploadIndex - 1]}`);
            await moveImageToPositionNumber(
                page,
                imageOriginalURLSLength2,
                imageOriginalURLSLength2 - 1,
                imagesToUpload[imageToUploadIndex - 1],
                false
            );
        } else {
            lgif(`Loop 01 Else`);
            lgif(
                `imageToUploadIndex: ${imageToUploadIndex}, imageToUploadIndex - 1: ${
                    imageToUploadIndex - 1
                }, imagesToUpload[imageToUploadIndex - 1]: ${imagesToUpload[imageToUploadIndex - 1]}`
            );
            lgif(`Moving image from ${imageOriginalURLSLength2} To ${imagesToUpload[imageToUploadIndex - 1]}`);
            await moveImageToPositionNumber(page, imageOriginalURLSLength2, imageOriginalURLSLength2, imagesToUpload[imageToUploadIndex - 1], false);
        }
    }
    lgif(`region: Move uploaded files on the correct location: End`);
    /* #endregion: Move uploaded files on the correct location: End */

    process.stdout.write(chalk.green.bold(`${logSymbols.success}${' '.repeat(4)}`));
    process.stdout.write(chalk.cyan(`\n Move Files To Last: `));

    /* #region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: Begin */
    lgif(
        `region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: Begin`
    );
    if (shiftOriginalFirstPositionToLastPositionFromDC) {
        lgif(`Shift Original First Position Moving image from ${imagesToUpload[0] + 1} To ${imageOriginalURLSLength2}`);
        await moveImageToPositionNumber(page, imageOriginalURLSLength2, imagesToUpload[0] + 1, imageOriginalURLSLength2);
    }
    lgif(
        `region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: End`
    );
    /* #endregion: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: End */

    process.stdout.write(chalk.green.bold(`${logSymbols.success}${' '.repeat(3)}`));
    process.stdout.write(chalk.cyan(` Lock The Images Checkbox: `));

    /* #region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : Begin */
    lgif(`region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : Begin`);

    const ImagesAreLockedFromWeb = await page.evaluate(
        // eslint-disable-next-line no-undef
        (selector) => document.querySelector(selector).checked,
        'input[type="checkbox"].vp[property-name="ImagesAreLocked"]'
    );
    lgif(`Current ImagesAreLockedFromWeb: ${ImagesAreLockedFromWeb}`);

    if (lockTheImagesCheckMarkFromDC !== null && lockTheImagesCheckMarkFromDC !== ImagesAreLockedFromWeb) {
        lgif(`clickOnButton: lockTheImagesCheckMarkFromDC: ${lockTheImagesCheckMarkFromDC}, ImagesAreLockedFromWeb: ${ImagesAreLockedFromWeb}`);
        clickOnButton(page, 'input[type="checkbox"].vp[property-name="ImagesAreLocked"]');
    }
    lgif(`region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : End`);
    /* #endregion: Check/Uncheck the 'Lock The Images' checkbox, according to setting : End */

    process.stdout.write(chalk.green.bold(`${logSymbols.success}${' '.repeat(2)}`));
    process.stdout.write(chalk.cyan(` Saving Now: `));

    /* #region: Bring save button to focus, move mouse over it, if automaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : Begin */
    lgif(
        `region: Bring save button to focus, move mouse over it, if automaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : Begin`
    );
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
    lgif(
        `region: Bring save button to focus, move mouse over it, if automaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : End`
    );
    /* #endregion: Bring save button to focus, move mouse over it, if automaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : End */

    process.stdout.write(chalk.green.bold(`${logSymbols.success}${' '.repeat(16)}`));
    process.stdout.write(chalk.cyan(` Saved: `));

    await page.waitForNavigation({ timeout: 300000 });

    process.stdout.write(chalk.green.bold(`${logSymbols.success}${' '.repeat(5)}`));

    const { moveSource, moveDestination } = getSourceAndDestinationFrom(typeOfStockPath, stockFolderPath, uniqueIdFolderPath, stockFilePath, false);
    const returnObj = { result: true, bookmarkAppendMesg: '', imagesUploaded: 0, moveSource: moveSource, moveDestination: moveDestination };
    lgif(`fn uploadImagesFromFolder() : END, Returning: returnObj: ${JSON.stringify(returnObj)}`);
    return returnObj;
}

async function moveImageToPositionNumber(page, totalImages, fromPosition, toPosition, isSlow = false, debug = true) {
    lgif(
        `fn moveImageToPositionNumber() : BEGIN, Params: page: OBJECT, totalImages: ${totalImages}, fromPosition: ${fromPosition}, toPosition: ${toPosition}, isSlow: ${isSlow}, debug: ${debug}`
    );
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

        lgif(`fromPositionSubImageVehicleId: ${fromPositionSubImageVehicleId}`);
        lgif(`toPositionSubImageVehicleId: ${toPositionSubImageVehicleId}`);

        lgif(`Moving to the fromPositionElement: ${fromPositionElement}`);
        await page.evaluate((element) => element.scrollIntoView(), fromPositionElement);
        lgif(`Confirming the fromPositionElement is in the browser viewport.`);
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

        lgif(`fromPositionElementRect: ${JSON.stringify(fromPositionElementRect)}`);

        // Making sure that the element is selected and its opacity changes to 0.6, which confirms selected.
        while (true) {
            lgif(
                `Moving the image little bit to check opacity: X: ${fromPositionElementRect.x + fromPositionElementRect.width / 2}, Y: ${
                    fromPositionElementRect.y + fromPositionElementRect.height / 2
                }`
            );
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
                lgif(`opacity: ${opacity} is still not 0.6, so sleeping for 350ms.`);
                msleep(50);
                await page.mouse.up();
                msleep(300);
            }
        }
        isSlow ? await waitForSeconds(4, true) : '';

        lgif(`Moving to the toPositionElement: ${toPositionElement}`);
        await page.evaluate((element) => element.scrollIntoView(), toPositionElement);
        lgif(`Confirming the toPositionElement is in the browser viewport.`);
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

        // After grabbing the image from the old position, and navigating to the new position, doing the moving action here
        let oldToPositionElementRectX;
        for (let lastIndex = 0; lastIndex <= 100; lastIndex++) {
            const toPositionElementRect = await page.evaluate((el) => {
                const { x, y, width, height } = el.getBoundingClientRect();
                return { x, y, width, height };
            }, toPositionElement);
            lgif(`From Element To: toPositionElementRect: ${JSON.stringify(toPositionElementRect)}`);

            if (oldToPositionElementRectX !== undefined && Math.abs(toPositionElementRect.x - oldToPositionElementRectX) > 50) {
                const currToPositionPrevIdSelector =
                    toPosition !== 1
                        ? `${imagesULSelector} > li:nth-child(${zeroPad(fromPosition < toPosition ? toPosition : toPosition - 1, 2)})`
                        : false;
                lgif(`toPosition !== 1: ${toPosition} !== 1       currToPositionPrevIdSelector: ${currToPositionPrevIdSelector}`);
                const currToPositionNextIdSelector =
                    totalImages !== toPosition
                        ? `${imagesULSelector} > li:nth-child(${zeroPad(fromPosition < toPosition ? toPosition + 2 : toPosition + 1, 2)})`
                        : false;
                lgif(
                    `totalImages !== toPosition: ${totalImages} !== ${toPosition}       currToPositionNextIdSelector: ${currToPositionNextIdSelector}`
                );
                const currToPositionPrevSubImageVehicleId =
                    currToPositionPrevIdSelector !== false
                        ? await page.$eval(`${currToPositionPrevIdSelector} > div > img`, (element, attr) => element.getAttribute(attr), 'vehicleid')
                        : false;
                const currToPositionNextSubImageVehicleId =
                    currToPositionNextIdSelector !== false
                        ? await page.$eval(`${currToPositionNextIdSelector} > div > img`, (element, attr) => element.getAttribute(attr), 'vehicleid')
                        : false;
                lgif(
                    `currToPositionPrevSubImageVehicleId: ${currToPositionPrevSubImageVehicleId}, currToPositionNextSubImageVehicleId: ${currToPositionNextSubImageVehicleId}`
                );

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
                    lgif(
                        `fromPositionSubImageVehicleId: ${fromPositionSubImageVehicleId},  currToPositionSubImageVehicleId: ${currToPositionSubImageVehicleId}`
                    );
                    if (fromPositionSubImageVehicleId === currToPositionSubImageVehicleId) {
                        lgif(`Breaking now ${fromPositionSubImageVehicleId} === ${currToPositionSubImageVehicleId}`);
                        break;
                    } else {
                        lgu(
                            `Image position changed, but the 'vechileId' from 'fromPositionSubImageVehicleId' and 'currToPositionSubImageVehicleId' doesn't match.` +
                                `fromPosition > toPosition: ${fromPosition} > ${toPosition}, toPositionSubImageVehicleId === currToPositionNextSubImageVehicleId: ${toPositionSubImageVehicleId} === ${currToPositionNextSubImageVehicleId}` +
                                `fromPosition < toPosition: ${fromPosition} < ${toPosition}, toPositionSubImageVehicleId === currToPositionPrevSubImageVehicleId: ${toPositionSubImageVehicleId} === ${currToPositionPrevSubImageVehicleId}`
                        );
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
                    lgu(`Image position changed, but the 'vechileId' from previous/next doesn't match.`);
                    await waitForSeconds(240, true);
                    process.exit(1);
                }
            }

            lgif(`toPosition: ${toPosition},        (toPosition + 1) % 5 === 1:  ${(toPosition + 1) % 5 === 1}`);
            if ((toPosition + 1) % 5 === 1) {
                lgif(
                    `Moving to the end of the row, Moving Element To:        X:${
                        toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex
                    }, Y:${toPositionElementRect.y + toPositionElementRect.height / 2}`
                );
                await page.mouse.move(
                    toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex,
                    toPositionElementRect.y + toPositionElementRect.height / 2,
                    { steps: 1 }
                );
            } else {
                lgif(
                    `Moving to NOT THE end of the row, ${
                        fromPosition > toPosition ? 'Coming from down to up' : 'Coming from up to down'
                    }, Moving Element To:        X:${
                        toPositionElementRect.x + toPositionElementRect.width / 2 + (fromPosition > toPosition ? -lastIndex : +lastIndex)
                    }, Y:${toPositionElementRect.y + toPositionElementRect.height / 2}`
                );
                await page.mouse.move(
                    toPositionElementRect.x + toPositionElementRect.width / 2 + (fromPosition > toPosition ? -lastIndex : +lastIndex),
                    toPositionElementRect.y + toPositionElementRect.height / 2,
                    { steps: 1 }
                );
            }
            /* #region Old code */
            // if (fromPosition > toPosition) {
            //     lgif(`Coming from down to up`);
            //     if ((toPosition + 1) % 5 === 1) {
            //         await page.mouse.move(
            //             toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex,
            //             toPositionElementRect.y + toPositionElementRect.height / 2,
            //             { steps: 1 }
            //         );
            //     } else {
            //         await page.mouse.move(
            //             toPositionElementRect.x + toPositionElementRect.width / 2 - lastIndex,
            //             toPositionElementRect.y + toPositionElementRect.height / 2,
            //             { steps: 1 }
            //         );
            //     }
            // } else {
            //     lgif(`Coming from up to down`);
            //     if ((toPosition + 1) % 5 === 1) {
            //         lgif(`Moving to the end of the row`);
            //         await page.mouse.move(
            //             toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex,
            //             toPositionElementRect.y + toPositionElementRect.height / 2,
            //             { steps: 1 }
            //         );
            //     } else {
            //         lgif(`Moving to not the end of the row`);
            //         await page.mouse.move(
            //             toPositionElementRect.x + toPositionElementRect.width / 2 + lastIndex,
            //             toPositionElementRect.y + toPositionElementRect.height / 2,
            //             { steps: 1 }
            //         );
            //     }
            // }
            /* #endregion Old code */
            msleep(10);
            isSlow ? await waitForSeconds(1, true) : '';
            oldToPositionElementRectX = toPositionElementRect.x;
            if (lastIndex === 100) {
                console.log(chalk.white.bgRed.bold(`Tried changing image position for 100 iterations, but it didn't work.`));
                lgu(`Tried changing image position for 100 iterations, but it didn't work.`);
                process.exit(1);
            }
        }
        isSlow ? await waitForSeconds(6, true) : '';
    } catch (error) {
        lgc('fn moveImageToPositionNumber() Try Error: ', error);
        await waitForSeconds(240, true);
    }
    lgif(`fn moveImageToPositionNumber() : END`);
}

function typeOfStockPathAndOtherVars(uniqueIdFolderPath, stockNumberFromBookmark) {
    lgif(
        `fn typeOfStockPathAndOtherVars() : BEGIN, Params: uniqueIdFolderPath: ${uniqueIdFolderPath}, stockNumberFromBookmark: ${stockNumberFromBookmark}`
    );
    const stockFolderPath = `${uniqueIdFolderPath}\\${stockNumberFromBookmark}`;
    let stockFilePath = fs.readdirSync(uniqueIdFolderPath).filter((file) => file.startsWith(`${stockNumberFromBookmark}.`));
    stockFilePath = stockFilePath.length === 1 ? stockFilePath[0] : undefined;
    const typeOfStockPath = stockFilePath === undefined ? 'stockFolder' : 'stockFile';
    lgif(
        `fn typeOfStockPathAndOtherVars() : END, Returning: typeOfStockPath: ${typeOfStockPath}, stockFolderPath: ${stockFolderPath}, stockFilePath: ${stockFilePath}`
    );
    return { typeOfStockPath: typeOfStockPath, stockFolderPath: stockFolderPath, stockFilePath: stockFilePath };
}

function getSourceAndDestinationFrom(typeOfStockPath, stockFolderPath, uniqueIdFolderPath, stockFilePath, isURLDoesNotExist) {
    lgif(
        `fn getSourceAndDestinationFrom() : BEGIN, Params: typeOfStockPath: ${typeOfStockPath}, stockFolderPath: ${stockFolderPath}, uniqueIdFolderPath: ${uniqueIdFolderPath}, stockFilePath: ${stockFilePath}, isURLDoesNotExist: ${isURLDoesNotExist}`
    );
    let moveSource;
    let moveDestination;
    if (typeOfStockPath === 'stockFolder') {
        lgif('typeOfStockPath is stockFolder');
        moveSource = `${stockFolderPath}\\`;
        moveDestination = `${config.finishedUploadingZonePath}\\${isURLDoesNotExist ? 'DeletedURLs\\' : ''}${todaysDate}\\${path.basename(
            path.dirname(stockFolderPath)
        )}\\${path.basename(stockFolderPath)}`;
    } else {
        lgif('typeOfStockPath IS NOT stockFolder');
        moveSource = `${uniqueIdFolderPath}\\${stockFilePath}`;
        moveDestination = `${config.finishedUploadingZonePath}\\${isURLDoesNotExist ? 'DeletedURLs\\' : ''}${todaysDate}\\${path.basename(
            uniqueIdFolderPath
        )}\\${stockFilePath}`;
    }
    lgif(`fn getSourceAndDestinationFrom() : END, Returning: moveSource: ${moveSource}, moveDestination: ${moveDestination}`);
    return { moveSource: moveSource, moveDestination: moveDestination };
}

// eslint-disable-next-line import/prefer-default-export
export { uploadBookmarkURL };
