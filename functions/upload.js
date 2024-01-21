import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';
import { URL as URLparser } from 'url';
import beautify from 'json-beautify';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted } from './datetime.js';
import { lge, lgw, lgi, lgif, lgh, lgtf, lgd, lgic } from './loggerandlocksupportive.js';
import { config } from '../configs/config.js';
import { msleep, waitForSeconds, waitForMilliSeconds } from './sleep.js';
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
import {
    getNumberOfImagesFromAllottedDealerNumberFolder,
    getUniqueIDFromAllottedDealerNumberFolder,
    perImageTimeToUpload,
    perVINTimeToUpload,
} from './datastoresupportive.js';
import { getFileCountNonRecursively } from './filesystem.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import checkBrowserClosed from './browserclosed.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
/* eslint-enable import/extensions */

function getFoldersInUploadingZone(debug = false) {
    const foldersToUpload = {};
    const uploadingZoneWithTodaysDate = path.join(config.uploadingZonePath, instanceRunDateFormatted);
    if (!syncOperationWithErrorHandling(fs.existsSync, uploadingZoneWithTodaysDate)) {
        return foldersToUpload;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const uploadingZoneSubFolderAndFiles of syncOperationWithErrorHandling(fs.readdirSync, uploadingZoneWithTodaysDate)) {
        const uploadingZoneSubFolderPath = path.join(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`, uploadingZoneSubFolderAndFiles);
        const uploadingZoneStat = syncOperationWithErrorHandling(fs.statSync, uploadingZoneSubFolderPath);

        if (uploadingZoneStat.isDirectory()) {
            debug ? lgd(`uploadingZoneSubFolderPath: ${uploadingZoneSubFolderPath}`) : null;
            const uniqueId = getUniqueIDFromAllottedDealerNumberFolder(uploadingZoneSubFolderAndFiles);
            const numberOfImagesAcToFolderName = parseInt(getNumberOfImagesFromAllottedDealerNumberFolder(uploadingZoneSubFolderAndFiles), 10);
            foldersToUpload[uniqueId] = {
                path: uploadingZoneSubFolderPath,
                imagesQty: numberOfImagesAcToFolderName,
                dealerFolderFilesQty: getFileCountNonRecursively(uploadingZoneSubFolderPath),
            };
        }
    }
    return foldersToUpload;
}

function getFoldersInUploadingZoneWithUniqueIDs(uniqueIdArr, debug = false) {
    const foldersInUploadingZone = [];
    const uploadingZoneWithTodaysDate = path.join(config.uploadingZonePath, instanceRunDateFormatted);
    if (!syncOperationWithErrorHandling(fs.existsSync, uploadingZoneWithTodaysDate)) {
        return foldersInUploadingZone;
    }
    // eslint-disable-next-line no-restricted-syntax
    for (const uploadingZoneSubFolderAndFiles of syncOperationWithErrorHandling(fs.readdirSync, uploadingZoneWithTodaysDate)) {
        const uploadingZoneSubFolderPath = path.join(`${config.uploadingZonePath}\\${instanceRunDateFormatted}`, uploadingZoneSubFolderAndFiles);
        const uploadingZoneStat = syncOperationWithErrorHandling(fs.statSync, uploadingZoneSubFolderPath);
        if (uploadingZoneStat.isDirectory()) {
            debug ? lgd(`uploadingZoneSubFolderPath: ${uploadingZoneSubFolderPath}`) : null;
            if (uniqueIdArr.some((uniqueId) => uploadingZoneSubFolderAndFiles.includes(`(#${uniqueId})`))) {
                foldersInUploadingZone.push(uploadingZoneSubFolderAndFiles);
            }
        }
    }
    return foldersInUploadingZone;
}

const printToLogBuffer = [];

async function uploadBookmarkURL(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, URL, userLoggedIn, debug = false) {
    debug
        ? lgtf(
              `fn uploadBookmarkURL() : BEGIN, Params: page: OBJECT, uniqueIdElement: ${uniqueIdElement}, uniqueIdFolderPath: ${uniqueIdFolderPath}, dealerFolder: ${dealerFolder}, name: ${name}, URL: ${URL}, debug: ${debug}`
          )
        : null;
    const startingRow = await getRowPosOnTerminal();
    lgi(`\t${userLoggedIn}/`, LineSeparator.false);
    lgi(`${dealerFolder}/`, Color.cyan, LoggingPrefix.false, LineSeparator.false);
    lgi(`${name} : ${URL}`, LoggingPrefix.false);
    printToLogBuffer.push(`\${userLoggedIn}/\${dealerFolder}/\${name} : \${URL}  :   ${userLoggedIn}/${dealerFolder}/${name} : ${URL}`);
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;

    let vehicleBookmarkUrlWOQueryParams = new URLparser(URL);
    vehicleBookmarkUrlWOQueryParams = vehicleBookmarkUrlWOQueryParams.host + vehicleBookmarkUrlWOQueryParams.pathname;

    let parsedCurrentUrlWOQueryParams = new URLparser(page.url());
    parsedCurrentUrlWOQueryParams = parsedCurrentUrlWOQueryParams.host + parsedCurrentUrlWOQueryParams.pathname;

    debug
        ? lgtf(`vehicleBookmarkUrlWOQueryParams: ${vehicleBookmarkUrlWOQueryParams}, parsedCurrentUrlWOQueryParams: ${parsedCurrentUrlWOQueryParams}`)
        : null;
    if (parsedCurrentUrlWOQueryParams !== vehicleBookmarkUrlWOQueryParams) {
        await gotoURL(page, URL, debug);
    }
    if (page.url().startsWith(`${getAppDomain()}/dashboard?`)) {
        debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
        debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
        debug ? '' : process.stdout.cursorTo(0);
        printToLogBuffer.pop();
        lgh(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)`);
        const VINNumberFromBookmark = name.split(' |#| ')[1].trim();
        const { typeOfVINPath, VINFolderOrFilePath } = typeOfVINPathAndOtherVars(uniqueIdFolderPath, VINNumberFromBookmark, debug);
        if (typeOfVINPath === undefined) {
            lge(`Unable to find file/folder for the VIN number: ${VINNumberFromBookmark} on the disk, data does not exist.`);
            return { result: false, bookmarkAppendMesg: '', imagesUploaded: 0 };
        }
        const { moveSource, moveDestination } = getSourceAndDestinationFrom(typeOfVINPath, VINFolderOrFilePath, true, debug);
        await waitForSeconds(5);
        const returnObj = {
            result: false,
            bookmarkAppendMesg: 'Ignoring (Does not Exist)',
            imagesUploaded: 0,
            moveSource: moveSource,
            moveDestination: moveDestination,
        };
        debug
            ? lgtf(
                  `fn uploadBookmarkURL() : END( From: Supplied URL doesn't exist ...... (Ignoring)), Returning: returnObj: ${beautify(
                      returnObj,
                      null,
                      3,
                      120
                  )}`
              )
            : null;
        return returnObj;
    }
    printToLogBuffer.map((value) => {
        debug ? lgtf(value) : null;
        return value;
    });
    printToLogBuffer.length = 0;

    const startTime = new Date();
    const returnObj = await uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, debug);
    if (returnObj.result === true) {
        const elapsedTimeInSeconds = (new Date().getTime() - startTime.getTime()) / 1000;
        const minutes = Math.floor(elapsedTimeInSeconds / 60)
            .toString()
            .padStart(2, '0');
        const seconds = Math.floor(elapsedTimeInSeconds % 60)
            .toString()
            .padStart(2, '0');
        const newEndingRow = await getRowPosOnTerminal();
        let currentColor;
        const totalTimeEstimatedInSeconds = Math.round(perImageTimeToUpload * returnObj.imagesUploaded + perVINTimeToUpload);
        const diffInEstimate = Math.round((elapsedTimeInSeconds / totalTimeEstimatedInSeconds) * 10) / 10;
        if (diffInEstimate > 3) {
            currentColor = Color.bgRed;
        } else if (diffInEstimate > 2) {
            currentColor = Color.red;
        } else if (diffInEstimate > 1.5) {
            currentColor = Color.yellow;
        } else {
            currentColor = Color.cyanNormal;
        }
        if (newEndingRow - 3 !== endingRow) {
            lgi(` (${minutes}:${seconds})${diffInEstimate > 1.5 ? `/${diffInEstimate}x ` : ''}`, currentColor, LoggingPrefix.false);
        } else {
            debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
            debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
            debug ? '' : process.stdout.cursorTo(0);
            lgi(` (${minutes}:${seconds})${diffInEstimate > 1.5 ? `/${diffInEstimate}x ` : ''}`, currentColor, LoggingPrefix.false);
        }
    }
    debug ? lgtf(`fn uploadBookmarkURL() : END, Returning: returnObj: ${beautify(returnObj, null, 3, 120)}`) : null;
    return returnObj;
}

async function uploadImagesFromFolder(page, uniqueIdElement, uniqueIdFolderPath, dealerFolder, name, debug = false) {
    debug ? lgtf(`fn uploadImagesFromFolder: Begin : (${uniqueIdElement}, ${uniqueIdFolderPath}, ${dealerFolder}, ${name}, ${debug})`) : null;
    const imageNumbersToDownloadFromDC = getImageNumbersToDownloadFromDC(dealerFolder);
    const deleteOriginalFromDC = getDeleteOriginalFromDC(dealerFolder);
    const shiftOriginalFirstPositionToLastPositionFromDC = getShiftOriginalFirstPositionToLastPositionFromDC(dealerFolder);
    const putFirstPositionEditedImageInTheLastPositionAlsoFromDC = getPutFirstPositionEditedImageInTheLastPositionAlsoFromDC(dealerFolder);
    const lockTheImagesCheckMarkFromDC = getLockTheImagesCheckMarkFromDC(dealerFolder);

    debug
        ? lgtf(
              `Parameters from excel: imageNumbersToDownloadFromDC: ${imageNumbersToDownloadFromDC}, deleteOriginalFromDC: ${deleteOriginalFromDC}, shiftOriginalFirstPositionToLastPositionFromDC: ${shiftOriginalFirstPositionToLastPositionFromDC}, putFirstPositionEditedImageInTheLastPositionAlsoFromDC: ${putFirstPositionEditedImageInTheLastPositionAlsoFromDC}, lockTheImagesCheckMarkFromDC: ${lockTheImagesCheckMarkFromDC},`
          )
        : null;

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

    const VINNumberFromBookmark = name.split(' |#| ')[1].trim();
    const VINNumberFromWeb = String(
        await page.$$eval('input#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_VehicleHeader_VIN', (el) => el.map((x) => x.getAttribute('value')))
    );

    if (VINNumberFromBookmark !== VINNumberFromWeb) {
        lge(`VIN Number values mismatch, name from web is '${VINNumberFromWeb}' vs name from bookmark is '${VINNumberFromBookmark}', Continuing.`);
        return { result: false, bookmarkAppendMesg: '', imagesUploaded: 0 };
    }

    const { typeOfVINPath, VINFolderOrFilePath } = typeOfVINPathAndOtherVars(uniqueIdFolderPath, VINNumberFromBookmark, debug);

    if (typeOfVINPath === undefined) {
        lge(`Unable to find file/folder for the VIN number: ${VINNumberFromBookmark} on the disk, data does not exist.`);
        return { result: false, bookmarkAppendMesg: '', imagesUploaded: 0 };
    }

    const imageDIVContainer = await page.$('.tn-list-container');
    const imageULContainer = await imageDIVContainer.$('.container.tn-list.sortable.deletable.ui-sortable');
    await imageULContainer.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));

    if (!page.url().endsWith('#imagery')) {
        await clickOnButton(page, '.vehicle-detail-tab.vehicle-detail-tab-imagery');
        await waitTillCurrentURLEndsWith(page, '#imagery');
    }
    debug ? lgtf(`uniqueIdFolderPath\\VINNumberFromBookmark: ${uniqueIdFolderPath}\\${VINNumberFromBookmark}`) : null;

    const startingRow = await getRowPosOnTerminal();
    lgi(` Total Files`, LineSeparator.false);

    /* #region: Uploading the files: Begin */
    debug ? lgtf(`region: Uploading the files: Begin`) : null;
    let firstImage;
    const imagesToUpload = [];
    let VINFolderPathList;
    // eslint-disable-next-line no-useless-catch
    try {
        VINFolderPathList =
            typeOfVINPath === 'VINFolder' ? syncOperationWithErrorHandling(fs.readdirSync, VINFolderOrFilePath) : [VINFolderOrFilePath];
        lgi(`(${zeroPad(VINFolderPathList.length, 2)}): `, LoggingPrefix.false, LineSeparator.false);

        // eslint-disable-next-line no-restricted-syntax
        for (const VINFolderSubFolderAndFiles of VINFolderPathList) {
            const VINFolderSubFolderAndFilesPath =
                typeOfVINPath === 'VINFolder' ? path.join(VINFolderOrFilePath, VINFolderSubFolderAndFiles) : VINFolderSubFolderAndFiles;
            if (firstImage === undefined) {
                firstImage = VINFolderSubFolderAndFiles;
            }
            debug
                ? lgtf(`VINFolderSubFolderAndFiles: ${VINFolderSubFolderAndFiles}, VINFolderSubFolderAndFilesPath: ${VINFolderSubFolderAndFilesPath}`)
                : null;
            const VINFolderSubFolderAndFilesStat = syncOperationWithErrorHandling(fs.statSync, VINFolderSubFolderAndFilesPath);

            if (VINFolderSubFolderAndFilesStat.isFile()) {
                debug ? lgtf(`It is a VINFile.`) : null;
                await page.bringToFront();
                const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
                await fileChooser.accept([path.resolve(VINFolderSubFolderAndFilesPath)]);
            }
            let imageNumber;
            if (typeOfVINPath === 'VINFolder') {
                const fileNameWOExt = VINFolderSubFolderAndFiles.split('.')[0];
                imageNumber = parseInt(fileNameWOExt, 10);
            } else {
                imageNumber = 1;
            }
            debug ? lgtf(`imagesToUpload.push(imageNumber: ${imageNumber})`) : null;
            imagesToUpload.push(imageNumber);
        }
        await showUploadFilesAndPercentages(page, startingRow, VINFolderPathList.length, false, debug);
        await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', 30, true);
        debug ? lgtf(`putFirstPositionEditedImageInTheLastPositionAlsoFromDC: ${putFirstPositionEditedImageInTheLastPositionAlsoFromDC}`) : null;
        debug
            ? lgtf(
                  `imageNumbersToDownloadFromDC.length === 1: ${imageNumbersToDownloadFromDC.length === 1}, imageNumbersToDownloadFromDC.length: ${
                      imageNumbersToDownloadFromDC.length
                  }`
              )
            : null;
        debug
            ? lgtf(
                  `imageNumbersToDownloadFromDC.length > 1 ${
                      imageNumbersToDownloadFromDC.length > 1
                  }, firstImage.startsWith('001.'): ${firstImage.startsWith('001.')}, imageNumbersToDownloadFromDC.length ${
                      imageNumbersToDownloadFromDC.length
                  }, firstImage ${firstImage}`
              )
            : null;
        if (
            putFirstPositionEditedImageInTheLastPositionAlsoFromDC &&
            (imageNumbersToDownloadFromDC.length === 1 || (imageNumbersToDownloadFromDC.length > 1 && firstImage.startsWith('001.')))
        ) {
            debug ? lgtf(`Uploading a copy now`) : null;
            const firstImagePath = typeOfVINPath === 'VINFolder' ? path.join(VINFolderOrFilePath, firstImage) : firstImage;
            await page.bringToFront();
            const [fileChooser] = await Promise.all([page.waitForFileChooser(), page.click('.uploadifive-button')]);
            await fileChooser.accept([path.resolve(firstImagePath)]);

            await showUploadFilesAndPercentages(page, startingRow, VINFolderPathList.length, true, debug);
            await waitForElementContainsOrEqualsHTML(page, '#uploadifive-fileInput-queue', '', 30, true);
        }
    } catch (error) {
        checkBrowserClosed(error, true);
        error.message = `fn uploadImagesFromFolder(): region: Uploading the files: \n${error.message}`;
        throw error;
    }
    debug ? lgtf(`region: Uploading the files: End`) : null;
    /* #endregion: Uploading the files: End */

    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;
    process.stdout.moveCursor(0, -diffInRows); // up one line
    process.stdout.clearLine(diffInRows); // from cursor to end
    process.stdout.cursorTo(0);
    lgi(` Uploading Files(${zeroPad(VINFolderPathList.length, 2)}): `, LineSeparator.false);
    lgi(`${logSymbols.success}${' '.repeat(3)}`, LoggingPrefix.false, LineSeparator.false);
    lgi(` Mark Deletion: `, LoggingPrefix.false, LineSeparator.false);

    /* #region: Mark file to delete the older files so as to replace with the newer files later on: Begin */
    debug ? lgtf(`region: Mark file to delete the older files so as to replace with the newer files later on: Begin`) : null;
    if (deleteOriginalFromDC) {
        debug ? lgtf(`deleteOriginalFromDC is set to True: ${deleteOriginalFromDC}`) : null;
        // eslint-disable-next-line no-restricted-syntax
        for (const imageToUpload of imagesToUpload) {
            if (shiftOriginalFirstPositionToLastPositionFromDC && imageToUpload === 1) {
                debug
                    ? lgtf(
                          `shiftOriginalFirstPositionToLastPositionFromDC && imageToUpload === 1, continuing for next loop, imageToUpload: ${imageToUpload}`
                      )
                    : null;
                // eslint-disable-next-line no-continue
                continue;
            }
            // eslint-disable-next-line no-constant-condition
            for (let delTryIndex = 0; delTryIndex < 30; delTryIndex++) {
                try {
                    const deleteId = `#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_ImagerySection_ctl01_ctl00_RepeaterTNImages_ctl${zeroPad(
                        imageToUpload - 1,
                        2
                    )}_Img1`;
                    debug ? lgtf(`waiting for enableAndClickOnButton on ${imageToUpload}`) : null;
                    await enableAndClickOnButton(page, deleteId);

                    debug ? lgtf(`waiting for delete to be set`) : null;
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
                    debug ? lgtf(`deletion set`) : null;
                } catch (error) {
                    checkBrowserClosed(error, true);
                    if (delTryIndex === 29) {
                        error.message = `fn uploadImagesFromFolder(): region: Mark file to delete the older files so as to replace with the newer files later on: \n${error.message}`;
                        throw error;
                    } else {
                        await waitForSeconds(10);
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                }
                break;
            }
        }
    }
    debug ? lgtf(`imagesToUpload at Delete: ${imagesToUpload}`) : null;
    debug ? lgtf(`region: Mark file to delete the older files so as to replace with the newer files later on: End`) : null;
    /* #endregion: Delete the older files to replace with the newer files: End */

    lgi(`${logSymbols.success}${' '.repeat(13)}`, LoggingPrefix.false, LineSeparator.false);
    lgi(` Move Files To Location: `, LoggingPrefix.false, LineSeparator.false);

    const imageDIVContainer2 = await page.$('.tn-list-container');
    const imageULContainer2 = await imageDIVContainer2.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS2 = await imageULContainer2.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));
    const imageOriginalURLSLength2 = imageOriginalURLS2.length;

    /* #region: Move uploaded files on the correct location: Begin */
    debug ? lgtf(`region: Move uploaded files on the correct location: Begin`) : null;
    debug ? lgtf(`imagesToUpload before move: ${imagesToUpload}`) : null;
    debug ? lgtf(`Moving uploaded files section: Start`) : null;
    // eslint-disable-next-line no-restricted-syntax
    for (let imageToUploadIndex = imagesToUpload.length; imageToUploadIndex > 0; imageToUploadIndex--) {
        if (
            putFirstPositionEditedImageInTheLastPositionAlsoFromDC &&
            (imageNumbersToDownloadFromDC.length === 1 || (imageNumbersToDownloadFromDC.length > 1 && firstImage.startsWith('001.')))
        ) {
            debug ? lgtf(`Loop 01 If`) : null;
            debug
                ? lgtf(
                      `imageToUploadIndex: ${imageToUploadIndex}, imageToUploadIndex - 1: ${
                          imageToUploadIndex - 1
                      }, imagesToUpload[imageToUploadIndex - 1]: ${imagesToUpload[imageToUploadIndex - 1]}`
                  )
                : null;
            debug ? lgtf(`Moving image from ${imageOriginalURLSLength2 - 1} To ${imagesToUpload[imageToUploadIndex - 1]}`) : null;
            await moveImageToPositionNumber(
                page,
                imageOriginalURLSLength2,
                imageOriginalURLSLength2 - 1,
                imagesToUpload[imageToUploadIndex - 1],
                false,
                debug
            );
        } else {
            debug ? lgtf(`Loop 01 Else`) : null;
            debug
                ? lgtf(
                      `imageToUploadIndex: ${imageToUploadIndex}, imageToUploadIndex - 1: ${
                          imageToUploadIndex - 1
                      }, imagesToUpload[imageToUploadIndex - 1]: ${imagesToUpload[imageToUploadIndex - 1]}`
                  )
                : null;
            debug ? lgtf(`Moving image from ${imageOriginalURLSLength2} To ${imagesToUpload[imageToUploadIndex - 1]}`) : null;
            await moveImageToPositionNumber(
                page,
                imageOriginalURLSLength2,
                imageOriginalURLSLength2,
                imagesToUpload[imageToUploadIndex - 1],
                false,
                debug
            );
        }
    }
    debug ? lgtf(`region: Move uploaded files on the correct location: End`) : null;
    /* #endregion: Move uploaded files on the correct location: End */

    lgi(`${logSymbols.success}${' '.repeat(4)}`, LoggingPrefix.false);
    lgi(` Move Files To Last: `, LineSeparator.false);

    /* #region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: Begin */
    debug
        ? lgtf(
              `region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: Begin`
          )
        : null;
    if (shiftOriginalFirstPositionToLastPositionFromDC) {
        debug ? lgtf(`Shift Original First Position Moving image from ${imagesToUpload[0] + 1} To ${imageOriginalURLSLength2}`) : null;
        await moveImageToPositionNumber(page, imageOriginalURLSLength2, imagesToUpload[0] + 1, imageOriginalURLSLength2, undefined, debug);
    }
    debug
        ? lgtf(
              `region: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: End`
          )
        : null;
    /* #endregion: Move files to the last if original files are set to retain(not delete), and if files are set to delete then check shiftOriginalFirstPositionToLastPositionFromDC and take action accordingly: End */

    lgi(`${logSymbols.success}${' '.repeat(4)}`, LoggingPrefix.false, LineSeparator.false);
    lgi(` Lock The Images Checkbox: `, LoggingPrefix.false, LineSeparator.false);

    /* #region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : Begin */
    debug ? lgtf(`region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : Begin`) : null;

    const imagesAreLockedFromWeb = await page.evaluate(
        // eslint-disable-next-line no-undef
        (selector) => document.querySelector(selector).checked,
        'input[type="checkbox"].vp[property-name="ImagesAreLocked"]'
    );
    debug ? lgtf(`Current ImagesAreLockedFromWeb: ${imagesAreLockedFromWeb}`) : null;

    if (lockTheImagesCheckMarkFromDC !== null && lockTheImagesCheckMarkFromDC !== imagesAreLockedFromWeb) {
        debug
            ? lgtf(`clickOnButton: lockTheImagesCheckMarkFromDC: ${lockTheImagesCheckMarkFromDC}, imagesAreLockedFromWeb : ${imagesAreLockedFromWeb}`)
            : null;
        let currImagesAreLockedFromWeb = imagesAreLockedFromWeb;
        while (imagesAreLockedFromWeb === currImagesAreLockedFromWeb) {
            await clickOnButton(page, 'input[type="checkbox"].vp[property-name="ImagesAreLocked"]', undefined, true);
            currImagesAreLockedFromWeb = await page.evaluate(
                // eslint-disable-next-line no-undef, no-loop-func
                (selector) => document.querySelector(selector).checked,
                'input[type="checkbox"].vp[property-name="ImagesAreLocked"]'
            );
        }
    }
    debug ? lgtf(`region: Check/Uncheck the 'Lock The Images' checkbox, according to setting : End`) : null;
    /* #endregion: Check/Uncheck the 'Lock The Images' checkbox, according to setting : End */

    lgi(`${logSymbols.success}${' '.repeat(2)}`, LoggingPrefix.false, LineSeparator.false);
    lgi(` Saving Now: `, LoggingPrefix.false, LineSeparator.false);

    /* #region: Bring save button to focus, move mouse over it, if isAutomaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : Begin */
    debug
        ? lgtf(
              `region: Bring save button to focus, move mouse over it, if isAutomaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : Begin`
          )
        : null;
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

    if (config.isAutomaticClickSaveButtonOnUpload) {
        await clickOnButton(page, saveButtonSelector);
    } else {
        await page.mouse.move(saveButtonElementRect.x + saveButtonElementRect.width / 2, saveButtonElementRect.y + saveButtonElementRect.height / 2, {
            steps: 1,
        });
    }
    debug
        ? lgtf(
              `region: Bring save button to focus, move mouse over it, if isAutomaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : End`
          )
        : null;
    /* #endregion: Bring save button to focus, move mouse over it, if isAutomaticClickSaveButtonOnUpload is enabled, then click on it, otherwise just move mouse over it : End */

    lgi(`${logSymbols.success}${' '.repeat(16)}`, LoggingPrefix.false, LineSeparator.false);
    lgi(` Saved: `, LoggingPrefix.false, LineSeparator.false);

    await page.waitForNavigation({ timeout: 300000 });

    lgi(`${logSymbols.success}${' '.repeat(5)}`, LoggingPrefix.false, LineSeparator.false);

    const { moveSource, moveDestination } = getSourceAndDestinationFrom(typeOfVINPath, VINFolderOrFilePath, false, debug);
    const returnObj = {
        result: true,
        bookmarkAppendMesg: '',
        imagesUploaded: VINFolderPathList.length,
        moveSource: moveSource,
        moveDestination: moveDestination,
    };
    debug ? lgtf(`fn uploadImagesFromFolder() : END, Returning: returnObj: ${beautify(returnObj, null, 3, 120)}`) : null;
    return returnObj;
}

async function moveImageToPositionNumber(page, totalImages, fromPosition, toPosition, isSlow = false, debug = false) {
    debug
        ? lgtf(
              `fn moveImageToPositionNumber() : BEGIN, Params: page: OBJECT, totalImages: ${totalImages}, fromPosition: ${fromPosition}, toPosition: ${toPosition}, isSlow: ${isSlow}, debug: ${debug}`
          )
        : null;
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

        debug ? lgtf(`fromPositionSubImageVehicleId: ${fromPositionSubImageVehicleId}`) : null;
        debug ? lgtf(`toPositionSubImageVehicleId: ${toPositionSubImageVehicleId}`) : null;

        debug ? lgtf(`Moving to the fromPositionElement: ${fromPositionElement}`) : null;
        await page.evaluate((element) => element.scrollIntoView(), fromPositionElement);
        debug ? lgtf(`Confirming the fromPositionElement is in the browser viewport.`) : null;
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

        debug ? lgtf(`fromPositionElementRect: ${beautify(fromPositionElementRect, null, 3, 120)}`) : null;

        // Making sure that the element is selected and its opacity changes to 0.6, which confirms selected.
        for (let elementSelIndex = 0; elementSelIndex < 30; elementSelIndex++) {
            debug
                ? lgtf(
                      `Moving the image little bit to check opacity: X: ${fromPositionElementRect.x + fromPositionElementRect.width / 2}, Y: ${
                          fromPositionElementRect.y + fromPositionElementRect.height / 2
                      }`
                  )
                : null;
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
                debug ? lgtf(`opacity: ${opacity} is still not 0.6, so sleeping for 350ms.`) : null;
                // eslint-disable-next-line no-lonely-if
                if (elementSelIndex === 29) {
                    throw new Error(
                        `region: Making sure that the element is selected and its opacity changes to 0.6, which confirms selected.\nopacity: ${opacity} is still not 0.6, so sleeping for 350ms.`
                    );
                } else {
                    msleep(50);
                    await page.mouse.up();
                    msleep(300);
                }
            }
        }
        isSlow ? await waitForSeconds(4, true) : '';

        debug ? lgtf(`Moving to the toPositionElement: ${toPositionElement}`) : null;
        await page.evaluate((element) => element.scrollIntoView(), toPositionElement);
        debug ? lgtf(`Confirming the toPositionElement is in the browser viewport.`) : null;
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
        for (let lastIndex = 0; lastIndex < 100; lastIndex++) {
            const toPositionElementRect = await page.evaluate((el) => {
                const { x, y, width, height } = el.getBoundingClientRect();
                return { x, y, width, height };
            }, toPositionElement);
            debug ? lgtf(`From Element To: toPositionElementRect: ${beautify(toPositionElementRect, null, 3, 120)}`) : null;

            if (oldToPositionElementRectX !== undefined && Math.abs(toPositionElementRect.x - oldToPositionElementRectX) > 50) {
                const currToPositionPrevIdSelector =
                    toPosition !== 1
                        ? `${imagesULSelector} > li:nth-child(${zeroPad(fromPosition < toPosition ? toPosition : toPosition - 1, 2)})`
                        : false;
                debug ? lgtf(`toPosition !== 1: ${toPosition} !== 1       currToPositionPrevIdSelector: ${currToPositionPrevIdSelector}`) : null;
                const currToPositionNextIdSelector =
                    totalImages !== toPosition
                        ? `${imagesULSelector} > li:nth-child(${zeroPad(fromPosition < toPosition ? toPosition + 2 : toPosition + 1, 2)})`
                        : false;
                debug
                    ? lgtf(
                          `totalImages !== toPosition: ${totalImages} !== ${toPosition}       currToPositionNextIdSelector: ${currToPositionNextIdSelector}`
                      )
                    : null;
                const currToPositionPrevSubImageVehicleId =
                    currToPositionPrevIdSelector !== false
                        ? await page.$eval(`${currToPositionPrevIdSelector} > div > img`, (element, attr) => element.getAttribute(attr), 'vehicleid')
                        : false;
                const currToPositionNextSubImageVehicleId =
                    currToPositionNextIdSelector !== false
                        ? await page.$eval(`${currToPositionNextIdSelector} > div > img`, (element, attr) => element.getAttribute(attr), 'vehicleid')
                        : false;
                debug
                    ? lgtf(
                          `currToPositionPrevSubImageVehicleId: ${currToPositionPrevSubImageVehicleId}, currToPositionNextSubImageVehicleId: ${currToPositionNextSubImageVehicleId}`
                      )
                    : null;

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
                    debug
                        ? lgtf(
                              `fromPositionSubImageVehicleId: ${fromPositionSubImageVehicleId},  currToPositionSubImageVehicleId: ${currToPositionSubImageVehicleId}`
                          )
                        : null;
                    if (fromPositionSubImageVehicleId === currToPositionSubImageVehicleId) {
                        debug ? lgtf(`Breaking now ${fromPositionSubImageVehicleId} === ${currToPositionSubImageVehicleId}`) : null;
                        break;
                    } else {
                        throw new Error(
                            `region: After grabbing the image from the old position, and navigating to the new position, doing the moving action here. (INNER)` +
                                `\nImage position changed, but the 'vechileId' from 'fromPositionSubImageVehicleId' and 'currToPositionSubImageVehicleId' doesn't match.` +
                                `fromPositionSubImageVehicleId(${fromPositionSubImageVehicleId}) === currToPositionSubImageVehicleId(${currToPositionSubImageVehicleId})` +
                                `\nfromPosition(${fromPosition}) > toPosition(${toPosition}), toPositionSubImageVehicleId(${toPositionSubImageVehicleId}) === currToPositionNextSubImageVehicleId(${currToPositionNextSubImageVehicleId})` +
                                `\nfromPosition(${fromPosition}) < toPosition(${toPosition}), toPositionSubImageVehicleId(${toPositionSubImageVehicleId}) === currToPositionPrevSubImageVehicleId(${currToPositionPrevSubImageVehicleId})`
                        );
                    }
                } else {
                    throw new Error(
                        `region: After grabbing the image from the old position, and navigating to the new position, doing the moving action here. (OUTER)` +
                            `\nImage position changed, but the 'vechileId' from previous/next doesn't match.` +
                            `\nfromPosition(${fromPosition}) > toPosition(${toPosition}), toPositionSubImageVehicleId(${toPositionSubImageVehicleId}) === currToPositionNextSubImageVehicleId(${currToPositionNextSubImageVehicleId})` +
                            `\nfromPosition(${fromPosition}) < toPosition(${toPosition}), toPositionSubImageVehicleId(${toPositionSubImageVehicleId}) === currToPositionPrevSubImageVehicleId(${currToPositionPrevSubImageVehicleId})`
                    );
                }
            }

            debug ? lgtf(`toPosition: ${toPosition},        (toPosition + 1) % 5 === 1:  ${(toPosition + 1) % 5 === 1}`) : null;
            if ((toPosition + 1) % 5 === 1) {
                debug
                    ? lgtf(
                          `Moving to the end of the row, Moving Element To:        X:${
                              toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex
                          }, Y:${toPositionElementRect.y + toPositionElementRect.height / 2}`
                      )
                    : null;
                await page.mouse.move(
                    toPositionElementRect.x + toPositionElementRect.width / 2 + 5 - lastIndex,
                    toPositionElementRect.y + toPositionElementRect.height / 2,
                    { steps: 1 }
                );
            } else {
                debug
                    ? lgtf(
                          `Moving to NOT THE end of the row, ${
                              fromPosition > toPosition ? 'Coming from down to up' : 'Coming from up to down'
                          }, Moving Element To:        X:${
                              toPositionElementRect.x + toPositionElementRect.width / 2 + (fromPosition > toPosition ? -lastIndex : +lastIndex)
                          }, Y:${toPositionElementRect.y + toPositionElementRect.height / 2}`
                      )
                    : null;
                await page.mouse.move(
                    toPositionElementRect.x + toPositionElementRect.width / 2 + (fromPosition > toPosition ? -lastIndex : +lastIndex),
                    toPositionElementRect.y + toPositionElementRect.height / 2,
                    { steps: 1 }
                );
            }
            msleep(10);
            isSlow ? await waitForSeconds(1, true) : '';
            oldToPositionElementRectX = toPositionElementRect.x;
            if (lastIndex === 99) {
                throw new Error(`region: Tried changing image position for 100 iterations, but it didn't work.`);
            }
        }
        isSlow ? await waitForSeconds(6, true) : '';
    } catch (error) {
        checkBrowserClosed(error, true);
        error.message = `fn moveImageToPositionNumber(): ${error.message}`;
        throw error;
    }
    debug ? lgtf(`fn moveImageToPositionNumber() : END`) : null;
}

function typeOfVINPathAndOtherVars(uniqueIdFolderPath, VINNumberFromBookmark, debug = false) {
    debug
        ? lgtf(
              `fn typeOfVINPathAndOtherVars() : BEGIN, Params: uniqueIdFolderPath: ${uniqueIdFolderPath}, VINNumberFromBookmark: ${VINNumberFromBookmark}`
          )
        : null;
    let typeOfVINPath;
    let VINFolderOrFilePath;
    const pathOfVINFolderOrFile = path.join(uniqueIdFolderPath, VINNumberFromBookmark);

    if (
        syncOperationWithErrorHandling(fs.existsSync, pathOfVINFolderOrFile) &&
        syncOperationWithErrorHandling(fs.statSync, pathOfVINFolderOrFile).isDirectory()
    ) {
        typeOfVINPath = 'VINFolder';
        VINFolderOrFilePath = pathOfVINFolderOrFile;
    } else if (
        syncOperationWithErrorHandling(fs.existsSync, pathOfVINFolderOrFile) &&
        syncOperationWithErrorHandling(fs.statSync, pathOfVINFolderOrFile).isFile()
    ) {
        throw new Error(
            `fn typeOfVINPathAndOtherVars(): Path: '${pathOfVINFolderOrFile}' is a file, without any extension like .jpg/.png, unable to process further.`
        );
    } else if (syncOperationWithErrorHandling(fs.existsSync, uniqueIdFolderPath)) {
        const filesStartingWithVINNumber = syncOperationWithErrorHandling(fs.readdirSync, uniqueIdFolderPath).filter((file) =>
            file.startsWith(`${VINNumberFromBookmark}.`)
        );
        if (filesStartingWithVINNumber.length > 1) {
            throw new Error(
                `fn typeOfVINPathAndOtherVars(): Multiple files found starting with the same '${'VINNumberFromBookmark'}.', unable to continue, found these: ${beautify(
                    filesStartingWithVINNumber,
                    null,
                    3,
                    120
                )} `
            );
        } else if (filesStartingWithVINNumber.length === 1) {
            typeOfVINPath = 'VINFile';
            VINFolderOrFilePath = path.join(uniqueIdFolderPath, filesStartingWithVINNumber[0]);
        } else {
            typeOfVINPath = undefined;
        }
    } else {
        typeOfVINPath = undefined;
    }
    debug
        ? lgtf(`fn typeOfVINPathAndOtherVars() : END, Returning: typeOfVINPath: ${typeOfVINPath}, VINFolderOrFilePath: ${VINFolderOrFilePath}`)
        : null;
    return { typeOfVINPath, VINFolderOrFilePath };
}

function getSourceAndDestinationFrom(typeOfVINPath, VINFolderOrFilePath, isURLDoesNotExist, debug = false) {
    debug
        ? lgtf(
              `fn getSourceAndDestinationFrom() : BEGIN, Params: typeOfVINPath: ${typeOfVINPath}, VINFolderOrFilePath: ${VINFolderOrFilePath}, isURLDoesNotExist: ${isURLDoesNotExist}`
          )
        : null;
    if (typeOfVINPath === undefined) {
        throw new Error(
            `fn getSourceAndDestinationFrom(): Unable to execute 'getSourceAndDestinationFrom' when 'typeOfVINPath === undefined', i.e. the source doesn't exist`
        );
    }
    if (typeOfVINPath === 'VINFolder') {
        debug ? lgtf('typeOfVINPath is VINFolder') : null;
    } else if (typeOfVINPath === 'VINFile') {
        debug ? lgtf('typeOfVINPath IS NOT VINFolder') : null;
    } else {
        throw new Error(`fn getSourceAndDestinationFrom(): Unexepected value of typeOfVINPath: '${typeOfVINPath}'`);
    }

    const moveSource = VINFolderOrFilePath;
    let moveDestination = config.doneUploadingZonePath;
    moveDestination = isURLDoesNotExist ? path.join(moveDestination, 'DeletedURLs') : moveDestination;
    moveDestination = path.join(moveDestination, instanceRunDateFormatted);
    moveDestination = path.join(moveDestination, path.basename(path.dirname(VINFolderOrFilePath)), path.basename(VINFolderOrFilePath));
    debug ? lgtf(`fn getSourceAndDestinationFrom() : END, Returning: moveSource: ${moveSource}, moveDestination: ${moveDestination}`) : null;
    return { moveSource: moveSource, moveDestination: moveDestination };
}

async function showUploadFilesAndPercentages(page, startingRow, totalUploadFiles, isAdditionalFile, debug = false) {
    let currentQueueContent;
    let previousQueueContent;
    let loopCountOfQueueContent = 0;
    let earlierCountOfComplete = null;
    while (loopCountOfQueueContent < 410) {
        const uploadifiveFileInputQueueEle = await page.$('#uploadifive-fileInput-queue');
        currentQueueContent = await page.$eval('#uploadifive-fileInput-queue', (element) => element.innerHTML);
        if (currentQueueContent !== '' && previousQueueContent === currentQueueContent) {
            loopCountOfQueueContent++;
            debug ? lgtf(`loopCountOfQueueContent : ${loopCountOfQueueContent}`) : null;
        } else if (currentQueueContent !== '') {
            const regexString = `<span class="fileinfo"> - (\\d{1,3}%)</span>`;
            const regexExpression = new RegExp(regexString);
            const doesSpanTagHasPercentage = regexExpression.test(currentQueueContent);

            const countOfComplete = await uploadifiveFileInputQueueEle.$$eval('.complete', (elements) => elements.length);
            debug ? lgtf(`countOfComplete : ${countOfComplete}`) : null;
            const endingRow = await getRowPosOnTerminal();
            const diffInRows = endingRow - startingRow;
            process.stdout.moveCursor(0, -diffInRows); // up one line
            process.stdout.clearLine(diffInRows); // from cursor to end
            process.stdout.cursorTo(0);

            let lgiOrLgic = lgic;
            if (earlierCountOfComplete !== countOfComplete) {
                if (doesSpanTagHasPercentage || countOfComplete === (isAdditionalFile ? 1 : totalUploadFiles)) {
                    lgiOrLgic = lgi;
                    earlierCountOfComplete = countOfComplete;
                }
            }
            lgiOrLgic(` Uploading Files(${zeroPad(totalUploadFiles, 2)}): `, LoggingPrefix.true, LineSeparator.false);
            for (let cnt = 1; cnt <= (isAdditionalFile ? totalUploadFiles + countOfComplete : countOfComplete); cnt++) {
                if (isAdditionalFile && cnt > totalUploadFiles) {
                    lgiOrLgic(`, `, LoggingPrefix.false, LineSeparator.false);
                }
                lgiOrLgic(`${zeroPad(cnt, 2)}.`, LoggingPrefix.false, LineSeparator.false);
                lgiOrLgic(`${logSymbols.success} `, LoggingPrefix.false, LineSeparator.false);
            }

            if (doesSpanTagHasPercentage) {
                if (isAdditionalFile) {
                    lgiOrLgic(`, `, LoggingPrefix.false, LineSeparator.false);
                }
                const percentage = currentQueueContent.match(regexExpression)[1];
                lgiOrLgic(`  ${zeroPad(countOfComplete + 1, 2)}.`, LoggingPrefix.false, LineSeparator.false);
                lgi(` ${percentage}`, Color.cyan, LoggingPrefix.false, LineSeparator.false);
                lgif(`...`, LoggingPrefix.false, LineSeparator.false);
            }
            loopCountOfQueueContent = 0;
        } else {
            break;
        }
        if (loopCountOfQueueContent === 410) {
            debug ? lgtf('ERROR: Upload process stuck while uploading files.') : null;
            throw new Error(`fn showUploadFilesAndPercentages(): Upload process stuck while uploading files.`);
        }
        await waitForMilliSeconds(30);
        previousQueueContent = currentQueueContent;
    }
    debug ? lgtf('showUploadFilesAndPercentages: Out of the loop') : null;
}

// eslint-disable-next-line import/prefer-default-export
export { typeOfVINPathAndOtherVars, getFoldersInUploadingZone, getFoldersInUploadingZoneWithUniqueIDs, uploadBookmarkURL };
