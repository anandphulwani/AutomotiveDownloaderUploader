import fs from 'fs';
import logSymbols from 'log-symbols';
import { getChromeBookmark } from 'chrome-bookmark-reader';
import { URL as URLparser } from 'url';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { waitForSeconds } from './sleep.js';
import { getRowPosOnTerminal } from './terminal.js';
import { attainLock, releaseLock, lgc, lgi, lgu, lgh, lgd, lgt, lgs, lgif } from './loggerandlocksupportive.js';
import { gotoURL } from './goto.js';
import { getImagesFromContent } from './pageextraction.js';
import { getIgnoreBookmarkURLObjects, getAppDomain } from './configsupportive.js';
import { trimMultipleSpacesInMiddleIntoOne, allTrimString, escapeRegExp } from './stringformatting.js';
import { writeFileWithComparingSameLinesWithOldContents } from './filesystem.js';
import { printSectionSeperator } from './others.js';
import Color from '../class/Colors.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import LineSeparator from '../class/LineSeparator.js';
import { instanceRunDateFormatted } from './datetime.js';
import keyInYNWithTimeout from './keyInYNWithTimeout.js';
import { clearLastLinesOnConsole } from './consolesupportive.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
import { getUsernameTrimmed } from './excelsupportive.js';
/* eslint-enable import/extensions */

const ignoreBookmarkURLObjects = getIgnoreBookmarkURLObjects();

function reformatJSONString(contents) {
    const JSONObj = JSON.parse(contents);
    const JSONString = JSON.stringify(JSONObj, null, 3);
    return JSONString;
}

function getDownloadedRegexString() {
    /**
     * 
     * Sample string to match:
     * 

    {
        "date_added": "13347947383854433",
        "date_last_used": "0",
        "guid": "6cadd41c-9d57-4e04-a677-e3c8c9d19ce5",
        "id": "4917",
        "name": "Germain Toyota of Naples - Inventory Online |#| Ignoring (Photo-Upload)",
        "type": "url",
        "url": "https://www.homenetiol.com/reporting/photo-upload?i=5&r=2390851"
    }

     *
     *
     */
    /**
     * Old download regex string
     */
    // const regexString = `({[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ")(.* \\|#\\| .*)("[\\s|\\S]*?"url": ".*"\\n[\\s]*})`;

    /**
     * Capture Block 01: Section 01: Matches `{ "date_added": "`
     */
    let regexString = `(`;
    regexString += `{`;
    regexString += `[\\s]*"date_added": "`;
    regexString += `)`;

    /**
     * Section 02: Matches `date_added` value
     */
    regexString += `.*`;

    /**
     * Capture Block 02: Section 03: Matches `"date_last_used": "` after `date_added` value,
     * Added a non capturing group, with an option that `"date_added"` string is not present
     */
    regexString += `(`;

    regexString += `"`;

    regexString += `(?:`;
    regexString += `(?!"date_added")`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;

    regexString += `*?`;

    regexString += `"date_last_used": "`;

    regexString += `)`;

    /**
     * Section 04: Matches `date_last_used` value
     */
    regexString += `.*`;

    /**
     * Capture Block 03
     */
    regexString += `(`;

    /**
     * Capture Block 03: Section 05: Matches text after `date_last_used` value,
     * Added a non capturing group, with an option that `"date_last_used"` string is not present
     */
    regexString += `"`;

    regexString += `(?:`;
    regexString += `(?!"date_last_used")`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;

    regexString += `*?`;

    /**
     * Capture Block 03: Section 06: Matches `"guid": "` text,
     * with a capturing group, matching guid value
     */
    regexString += `"guid": "`;

    regexString += `(`;
    regexString += `.*`;
    regexString += `)`;

    regexString += `"`;

    /**
     * Capture Block 03: Section 07: Matches text after `guid` value which includes `"name": "` text,
     * Added a non capturing group, with an option that `"guid"` string is not present
     */
    regexString += `(?:`;
    regexString += `(?!"guid": )`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;

    regexString += `*?`;

    regexString += `"name": "`;

    regexString += `)`;

    /**
     * Capture Block 04: Section 08: Matches name values which contain hash tags
     */
    regexString += `(`;
    regexString += `.* \\|#\\| .*`;
    regexString += `)`;

    /**
     * Capture Block 05: Section 09: Matches everything after name value with hash tag, which includes
     * `"url"` text with a value and a closing curly bracket
     */
    regexString += `(`;
    regexString += `"[\\s|\\S]*?"url": ".*"\\n[\\s]*`;
    regexString += `}`;
    regexString += `)`;

    return regexString;
}

function getAllottedFolderRegexString() {
    /**
     * 
     * Sample string to match:
     * 

                     "date_added": "13347947383854329",
                     "date_last_used": "0",
                     "date_modified": "13347947383854678",
                     "guid": "df441576-b1b1-4724-842d-a5ada02b5d85",
                     "id": "4916",
                     "name": "224a |#| 01002",
                     "type": "folder"

     *
     *
     */
    /**
     * Old download regex string
     */
    // const allottedFolderRegexString = `([ ]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ")(.* \\|#\\| .*)("(?:(?!"name": )[\\s|\\S])*?"type": "folder")`;

    /**
     * Capture Block 01: Section 01: Matches spaces with `"date_added": "`
     */
    let regexString = `(`;
    regexString += `[ ]*"date_added"`;
    regexString += `)`;

    /**
     * Section 02: Matches `date_added` value
     */
    regexString += `.*`;

    /**
     * Capture Block 02: Section 03: Matches `"date_last_used": "` after `date_added` value,
     * Added a non capturing group, with an option that `"date_added"` string is not present
     */
    regexString += `(`;

    regexString += `"`;

    regexString += `(?:`;
    regexString += `(?!"date_added")`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;
    regexString += `*?`;

    regexString += `"date_last_used": "`;
    regexString += `)`;

    /**
     * Section 04: Matches `date_last_used` value
     */
    regexString += `.*`;

    /**
     * Capture Block 03: Section 05: Matches `"date_modified": "` after `date_last_used` value,
     * Added a non capturing group, with an option that `"date_last_used"` string is not present
     */
    regexString += `(`;

    regexString += `"`;

    regexString += `(?:`;
    regexString += `(?!"date_last_used")`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;
    regexString += `*?`;

    regexString += `"date_modified": "`;
    regexString += `)`;

    /**
     * Section 06: Matches `date_modified` value
     */
    regexString += `.*`;

    /**
     * Capture Block 04
     */
    regexString += `(`;

    /**
     * Capture Block 04: Section 07: Matches text after `date_modified` value,
     * Added a non capturing group, with an option that `"date_modified"` string is not present
     */
    regexString += `"`;

    regexString += `(?:`;
    regexString += `(?!"date_modified")`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;

    regexString += `*?`;

    /**
     * Capture Block 04: Section 08: Matches `"guid": "` text,
     * with a capturing group, matching guid value
     */
    regexString += `"guid": "`;

    regexString += `(`;
    regexString += `.*`;
    regexString += `)`;

    regexString += `"`;

    /**
     * Capture Block 04: Section 09: Matches text after `guid` value which includes `"name": "` text,
     * Added a non capturing group, with an option that `"guid"` string is not present
     */
    regexString += `(?:`;
    regexString += `(?!"guid": )`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;

    regexString += `*?`;

    regexString += `"name": "`;

    regexString += `)`;

    /**
     * Capture Block 05: Section 10: Matches name values which contain hash tags
     */
    regexString += `(`;
    regexString += `.* \\|#\\| .*`;
    regexString += `)`;

    /**
     * Capture Block 06: Section 11: Matches everything after name value with hash tag, which includes
     * `"url"` text with a value and a closing curly bracket
     */
    regexString += `(`;

    regexString += `"`;
    regexString += `(?:`;
    regexString += `(?!"name": )`;
    regexString += `[\\s|\\S]`;
    regexString += `)`;

    regexString += `*?`;

    regexString += `"type": "folder"`;

    regexString += `)`;

    return regexString;
}

async function downloadBookmarksFromSourceToProcessing(debug = false) {
    lgt(`Fetching bookmarks from the source: `, Color.cyanNormal, LineSeparator.false);
    const { sourceBookmarksFilePath, processingBookmarksWithoutSyncFilePath } = config;
    let initialSourceJSONString;
    let initialLineCount;
    let sourceJSONString;

    attainLock(sourceBookmarksFilePath, undefined, false);
    attainLock(processingBookmarksWithoutSyncFilePath, undefined, false);
    lgt(`01:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false, LineSeparator.false);

    try {
        // Read the contents of both JSON files into memory
        const sourceContents = syncOperationWithErrorHandling(fs.readFileSync, sourceBookmarksFilePath, 'utf8');
        const processingContents = syncOperationWithErrorHandling(fs.readFileSync, processingBookmarksWithoutSyncFilePath, 'utf8');

        lgt(`02:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false, LineSeparator.false);
        // Parse the contents of both JSON files into JavaScript objects
        let sourceObj;
        try {
            sourceObj = JSON.parse(sourceContents);
        } catch (err) {
            console.log('');
            lgs(`Source 'Bookmarks' file, is a corrupted JSON, cannot sync bookmarks from the source, \nPath :${sourceBookmarksFilePath}.`);
            releaseLock(processingBookmarksWithoutSyncFilePath, undefined, false);
            releaseLock(sourceBookmarksFilePath, undefined, false);
            return;
        }

        let processingObj;
        try {
            processingObj = JSON.parse(processingContents);
        } catch (err) {
            console.log('');
            lgs(
                `Processing 'Bookmarks' file, is a corrupted JSON, cannot sync bookmarks from the source, \nPath: '${processingBookmarksWithoutSyncFilePath}'`
            );
            releaseLock(processingBookmarksWithoutSyncFilePath, undefined, false);
            releaseLock(sourceBookmarksFilePath, undefined, false);
            process.exit(1);
        }

        // eslint-disable-next-line no-restricted-syntax
        for (const key in sourceObj) {
            if (key !== 'roots') {
                delete sourceObj[key];
            }
        }
        // eslint-disable-next-line no-restricted-syntax
        for (const key in sourceObj.roots) {
            if (key !== 'bookmark_bar') {
                delete sourceObj.roots[key];
            }
        }

        sourceJSONString = JSON.stringify(sourceObj, null, 3);
        const processingJSONString = JSON.stringify(processingObj, null, 3);

        initialSourceJSONString = sourceJSONString;
        initialLineCount = sourceJSONString.trim().split(/\r\n|\r|\n/).length;
        lgt(`03:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false, LineSeparator.false);

        /**
         * Copying the names of bookmark urls which are downloaded
         */

        const downloadedRegexExpression = new RegExp(getDownloadedRegexString(), 'g');

        let isGUIDInProcessingBookmarksPresentInSourceBookmarks = false;
        let downloadedBookmarkBlockMatch = downloadedRegexExpression.exec(processingJSONString);
        while (downloadedBookmarkBlockMatch !== null) {
            debug ? lgd(`Found bookmark URL with GUID: ${downloadedBookmarkBlockMatch[4]}`) : null;
            if (downloadedBookmarkBlockMatch[0].split(/\r\n|\r|\n/).length > 15) {
                lgu(`Bookmarks URL Done Section: downloadedBookmarkBlockMatch's length is more than 15:\n${downloadedBookmarkBlockMatch}`);
                process.exit(1);
            }

            const replaceString = `${escapeRegExp(downloadedBookmarkBlockMatch[1])}.*${escapeRegExp(downloadedBookmarkBlockMatch[2])}.*${escapeRegExp(
                downloadedBookmarkBlockMatch[3]
            )}(.*)${escapeRegExp(downloadedBookmarkBlockMatch[6])}`;
            const replaceExpression = new RegExp(replaceString);
            const oldSourceJSONString = sourceJSONString;
            sourceJSONString = sourceJSONString.replace(
                replaceExpression,
                downloadedBookmarkBlockMatch[0].replace(/"name": ".* \|#\|/, '"name": "$1 |#|')
            );
            oldSourceJSONString !== sourceJSONString ? (isGUIDInProcessingBookmarksPresentInSourceBookmarks = true) : null;
            if (oldSourceJSONString === sourceJSONString) {
                debug ? lgd(`Unable to find URL's GUID:${downloadedBookmarkBlockMatch[4]} in source bookmarks, possible removal/deletion.`) : null;
            }
            downloadedBookmarkBlockMatch = downloadedRegexExpression.exec(processingJSONString);
        }

        if (!isGUIDInProcessingBookmarksPresentInSourceBookmarks) {
            if (config.lotLastRunDate === instanceRunDateFormatted) {
                console.log('');
                printSectionSeperator(undefined, true);
                const questionToRefreshBookmarksInSameDay =
                    'Fresh bookmarks added for today, all previous bookmarks state(bookmarks URL downloaded/bookmarks folder allotted) will be lost, continue?';
                const resultOfKeyInYNToRefreshBookmarksInSameDay = await keyInYNWithTimeout(questionToRefreshBookmarksInSameDay, 25000, false);
                if (resultOfKeyInYNToRefreshBookmarksInSameDay.isDefaultOption) {
                    printSectionSeperator(undefined, true);
                    await waitForSeconds(5);
                    clearLastLinesOnConsole(2);
                } else {
                    lgif(`${questionToRefreshBookmarksInSameDay}: ${resultOfKeyInYNToRefreshBookmarksInSameDay.answer}`);
                }
                if (!resultOfKeyInYNToRefreshBookmarksInSameDay.answer) {
                    releaseLock(processingBookmarksWithoutSyncFilePath, undefined, false);
                    releaseLock(sourceBookmarksFilePath, undefined, false);
                    return;
                }
            }
        }

        let sourceJSONStringLength = sourceJSONString.trim().split(/\r\n|\r|\n/).length;
        if (initialLineCount - sourceJSONStringLength !== 0) {
            lgu(
                `Before Copying the names of bookmarks folders which are allotted: initialLineCount(${initialLineCount}) and sourceJSONStringLineCount(${sourceJSONStringLength}) is not the same.\nsourceJSONString: ${sourceJSONString}`
            );
            process.exit(1);
        }
        lgt(`04:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false, LineSeparator.false);

        /**
         * Copying the names of bookmarks folders which are allotted
         */
        const allottedFolderRegexExpression = new RegExp(getAllottedFolderRegexString(), 'g');
        let allottedFolderBookmarkBlockMatch = allottedFolderRegexExpression.exec(processingJSONString);
        while (allottedFolderBookmarkBlockMatch !== null) {
            debug ? lgd(`Found bookmark folder with GUID: ${allottedFolderBookmarkBlockMatch[5]}`) : null;
            if (allottedFolderBookmarkBlockMatch[0].split(/\r\n|\r|\n/).length > 9) {
                lgu(
                    `Bookmarks Folders Allotted Section: allottedFolderBookmarkBlockMatch's length is more than 9:\n${allottedFolderBookmarkBlockMatch}`
                );
                process.exit(1);
            }

            const replaceString = `${escapeRegExp(allottedFolderBookmarkBlockMatch[1])}.*${escapeRegExp(
                allottedFolderBookmarkBlockMatch[2]
            )}.*${escapeRegExp(allottedFolderBookmarkBlockMatch[3])}.*${escapeRegExp(allottedFolderBookmarkBlockMatch[4])}(.*)${escapeRegExp(
                allottedFolderBookmarkBlockMatch[7]
            )}`;
            const replaceExpression = new RegExp(replaceString);
            const oldSourceJSONString = sourceJSONString;
            sourceJSONString = sourceJSONString.replace(
                replaceExpression,
                allottedFolderBookmarkBlockMatch[0].replace(/"name": ".* \|#\|/, '"name": "$1 |#|')
            );
            if (oldSourceJSONString === sourceJSONString) {
                debug
                    ? lgd(`Unable to find folder's GUID:${allottedFolderBookmarkBlockMatch[5]} in source bookmarks, possible removal/deletion.`)
                    : null;
            }
            allottedFolderBookmarkBlockMatch = allottedFolderRegexExpression.exec(processingJSONString);
        }

        sourceJSONStringLength = sourceJSONString.trim().split(/\r\n|\r|\n/).length;
        if (initialLineCount - sourceJSONStringLength !== 0) {
            lgu(
                `Before writing bookmarks file: initialLineCount(${initialLineCount}) and writing file line count sourceJSONStringLineCount(${sourceJSONStringLength}) is not the same.\nsourceJSONString: ${sourceJSONString}`
            );
            process.exit(1);
        }
        lgt(`05:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false, LineSeparator.false);

        debug ? lgd('Writing bookmarks file') : null;
        writeFileWithComparingSameLinesWithOldContents(processingBookmarksWithoutSyncFilePath, sourceJSONString, initialSourceJSONString);
        releaseLock(processingBookmarksWithoutSyncFilePath, undefined, false);
        releaseLock(sourceBookmarksFilePath, undefined, false);
        lgt(`06:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false);
        printSectionSeperator('info');
    } catch (err) {
        lgc(`Unable to download Bookmarks from source to processing`, err);
        printSectionSeperator('catcherror');
        lgc(`initialSourceJSONString: ${initialSourceJSONString}`);
        printSectionSeperator('catcherror');
        lgc(`sourceJSONString: ${sourceJSONString}`);
        printSectionSeperator('catcherror');
        lgc(
            `initialLineCount: ${initialLineCount}, finalLineCount: ${
                sourceJSONString !== undefined ? sourceJSONString.trim().split(/\r\n|\r|\n/).length : undefined
            }`
        );
        printSectionSeperator('catcherror');
        releaseLock(processingBookmarksWithoutSyncFilePath, undefined, false);
        releaseLock(sourceBookmarksFilePath, undefined, false);
        process.exit(1);
    }
}

async function handleBookmarkURL(page, lotIndex, username, dealerFolder, name, URL, urlsDownloaded, debug = false) {
    if (name.includes(' |#| ')) {
        return {
            result: false,
            bookmarkAppendMesg: 'Name already has Pipe(|)Hash(#)Pipe(|) sign',
            imagesDownloaded: 0,
            urlsDownloaded: urlsDownloaded,
        };
    }
    const ignoreBookmarkURLObjectFindResults = ignoreBookmarkURLObjects.find((ignoreBookmarkURLObject) => {
        if (URL.startsWith(ignoreBookmarkURLObject.URLStartsWith)) {
            return true;
        }
        return false;
    });
    if (ignoreBookmarkURLObjectFindResults !== undefined) {
        lgh(`\t${name} : ${URL} : ${ignoreBookmarkURLObjectFindResults.ignoreMesgInConsole}`, Color.magenta);
        return {
            result: false,
            bookmarkAppendMesg: ignoreBookmarkURLObjectFindResults.ignoreMesgInBookmark,
            imagesDownloaded: 0,
            urlsDownloaded: urlsDownloaded,
        };
    }

    const startingRow = await getRowPosOnTerminal();
    lgi(`\t${name} : ${URL}`);
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;

    let vehicleBookmarkUrlWOQueryParams = new URLparser(URL);
    vehicleBookmarkUrlWOQueryParams = vehicleBookmarkUrlWOQueryParams.host + vehicleBookmarkUrlWOQueryParams.pathname;
    if (Object.keys(urlsDownloaded).includes(vehicleBookmarkUrlWOQueryParams)) {
        debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
        debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
        debug ? '' : process.stdout.cursorTo(0);
        lgh(
            `\t${name} : ${URL} : Supplied URL is a duplicate, already downloaded by: ${urlsDownloaded[vehicleBookmarkUrlWOQueryParams]} ...... (Ignoring)`
        );
        await waitForSeconds(5);
        return {
            result: false,
            bookmarkAppendMesg: `Ignoring (Duplicate, Already downloaded by: ${urlsDownloaded[vehicleBookmarkUrlWOQueryParams]})`,
            imagesDownloaded: 0,
            urlsDownloaded: urlsDownloaded,
        };
    }

    let parsedCurrentUrlWOQueryParams = new URLparser(page.url());
    parsedCurrentUrlWOQueryParams = parsedCurrentUrlWOQueryParams.host + parsedCurrentUrlWOQueryParams.pathname;
    if (parsedCurrentUrlWOQueryParams !== vehicleBookmarkUrlWOQueryParams) {
        await gotoURL(page, URL, debug);
    }
    if (page.url().startsWith(`${getAppDomain()}/dashboard?`)) {
        debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
        debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
        debug ? '' : process.stdout.cursorTo(0);
        lgh(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)`);
        await waitForSeconds(5);
        return { result: false, bookmarkAppendMesg: 'Ignoring (Does not Exist)', imagesDownloaded: 0, urlsDownloaded: urlsDownloaded };
    }

    const returnObj = await getImagesFromContent(page, lotIndex, username, dealerFolder);
    if (returnObj.result) {
        urlsDownloaded[vehicleBookmarkUrlWOQueryParams] = dealerFolder;
        returnObj.urlsDownloaded = urlsDownloaded;
    } else {
        returnObj.urlsDownloaded = urlsDownloaded;
    }
    return returnObj;
}

function removeChecksumFromBookmarksObj(bookmarksObj) {
    const jsonString = JSON.stringify(bookmarksObj).replace(/\{(?:(?!\{).)*?"checksum":".*?".*?,/g, '{');
    return JSON.parse(jsonString);
}

function replaceBookmarksElementByGUIDAndWriteToBookmarksFile(element, guid, appendText) {
    const elementsDetails = {
        name: {
            blockRegex: `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`,
            elementRegex: `"name": "(.*)"`,
            elementSubstitutionValue: `"name": "$1 |#| ${appendText}"`,
        },
        foldername: {
            blockRegex: `[ ]*"date_added"[^\\{\\}\\]\\[]*?"guid": "${guid}",[^\\{\\}\\]\\[]*?"type": "folder"`,
            elementRegex: `"name": "(.*)"`,
            elementSubstitutionValue: `"name": "$1 |#| ${appendText}"`,
            elementAlreadySubstituedCheckRegex: `"name": .* \\|#\\| .*`,
            elementAlreadySubstituedSubstitutionValue: `"name": "$1,${appendText}"`,
        },
    };
    const fileToOperateOn = config.processingBookmarksWithoutSyncFilePath;
    attainLock(fileToOperateOn, undefined, false);
    try {
        const fileContents = syncOperationWithErrorHandling(fs.readFileSync, fileToOperateOn, 'utf8');

        let bookmarksFileJSONObj = JSON.parse(fileContents);
        bookmarksFileJSONObj = removeChecksumFromBookmarksObj(bookmarksFileJSONObj);
        let bookmarksFileText = JSON.stringify(bookmarksFileJSONObj, null, 3);

        const blockRegexExpression = new RegExp(elementsDetails[element].blockRegex);
        if (!blockRegexExpression.test(bookmarksFileText)) {
            lgu(
                [
                    'Unable to match regex for fn replaceBookmarksElementByGUIDAndWriteToBookmarksFile()',
                    elementsDetails[element].blockRegex,
                    '-'.repeat(120) + bookmarksFileText + '-'.repeat(120),
                ].join('\n')
            );
            process.exit(1);
        }
        const bookmarkBlockText = bookmarksFileText.match(blockRegexExpression)[0];

        let bookmarkBlockNewText;
        const regexExpression = new RegExp(elementsDetails[element].elementRegex);
        if (elementsDetails[element].elementAlreadySubstituedCheckRegex) {
            const elementAlreadySubstituedCheckRegexExpression = new RegExp(elementsDetails[element].elementAlreadySubstituedCheckRegex);
            if (elementAlreadySubstituedCheckRegexExpression.test(bookmarkBlockText)) {
                bookmarkBlockNewText = bookmarkBlockText.replace(regexExpression, elementsDetails[element].elementAlreadySubstituedSubstitutionValue);
            }
        }
        if (bookmarkBlockNewText === undefined) {
            bookmarkBlockNewText = bookmarkBlockText.replace(regexExpression, elementsDetails[element].elementSubstitutionValue);
        }

        bookmarksFileText = bookmarksFileText.replace(bookmarkBlockText, bookmarkBlockNewText);
        bookmarksFileText = reformatJSONString(bookmarksFileText);
        const returnVal = writeFileWithComparingSameLinesWithOldContents(fileToOperateOn, bookmarksFileText, fileContents);
        if (!returnVal) {
            lgu(
                [
                    `${fileContents}\n${'-'.repeat(120)}`,
                    `${bookmarksFileText}\n${'-'.repeat(120)}`,
                    `initialLineCount: ${fileContents.trim().split(/\r\n|\r|\n/).length}, finalLineCount: ${
                        bookmarksFileText.split(/\r\n|\r|\n/).length
                    }`,
                ].join('\n')
            );
            process.exit(1);
        }
        // createBackupOfFile(fileToOperateOn, bookmarksFileText);
        releaseLock(fileToOperateOn, undefined, false);
    } catch (err) {
        releaseLock(fileToOperateOn, undefined, false);
        lgc(`replaceBookmarksElementByGUIDAndWriteToBookmarksFile fn() Catch block`, err);
        process.exit(1);
    }
}

function getBookmarkFolderGUIDFromUsernameDealerNumber(username, dealerNumber) {
    const { processingBookmarksWithoutSyncFilePath, bookmarkOptions } = config;
    const bookmarks = getChromeBookmark(processingBookmarksWithoutSyncFilePath, bookmarkOptions);
    let filteredData = bookmarks.filter((topLevelBookmark) => topLevelBookmark.name === 'Bookmarks bar');
    if (filteredData.length === 0) {
        return null;
    }
    if (filteredData.length > 1) {
        filteredData = filteredData.reduce((earliest, current) => {
            const earliestDateAdded = parseInt(earliest.date_added, 10);
            const currentDateAdded = parseInt(current.date_added, 10);
            return earliestDateAdded < currentDateAdded ? earliest : current;
        });
        filteredData = [filteredData];
    }
    // eslint-disable-next-line prefer-destructuring
    filteredData = filteredData[0].children;
    filteredData = filteredData.filter((usernameLevelBookmark) => getUsernameTrimmed(usernameLevelBookmark.name) === username);
    if (filteredData.length === 0) {
        return null;
    }
    filteredData = filteredData[0].children;

    filteredData = filteredData.filter(
        (dealerLevelBookmark) =>
            allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerLevelBookmark.name)) ===
                allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerNumber)) ||
            allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerLevelBookmark.name)).startsWith(
                `${allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerNumber))} |#| `
            )
    );
    if (filteredData.length === 0) {
        return null;
    }
    return filteredData[0].guid;
}

function getBookmarkUsernameFolderFromUniqueId(uniqueId) {
    const { processingBookmarksWithoutSyncFilePath, bookmarkOptions } = config;
    const bookmarks = getChromeBookmark(processingBookmarksWithoutSyncFilePath, bookmarkOptions);
    let filteredData = bookmarks.filter((topLevelBookmark) => topLevelBookmark.name === 'Bookmarks bar');
    if (filteredData.length > 1) {
        filteredData = filteredData.reduce((earliest, current) => {
            const earliestDateAdded = parseInt(earliest.date_added, 10);
            const currentDateAdded = parseInt(current.date_added, 10);
            return earliestDateAdded < currentDateAdded ? earliest : current;
        });
        filteredData = [filteredData];
    }
    // eslint-disable-next-line prefer-destructuring
    filteredData = filteredData[0].children;

    const uniqueIdFolderRegex = new RegExp(`\\|#\\|.*?${uniqueId}.*\\n[\\s]*"type": "folder"`);
    filteredData = filteredData.filter((usernameLevelBookmark) => uniqueIdFolderRegex.test(JSON.stringify(usernameLevelBookmark.children, null, 3)));
    return filteredData[0].name;
}

function getUniqueIdPairsFromDealerBookmarkName(bookmarkname) {
    if (!bookmarkname.includes(' |#| ')) {
        return [];
    }
    const bookmarnameUniqueId = bookmarkname.split(' |#| ')[1].trim();
    const bookmarnameUniqueIdArr = bookmarnameUniqueId.split(',');
    return bookmarnameUniqueIdArr;
}

// eslint-disable-next-line import/prefer-default-export
export {
    downloadBookmarksFromSourceToProcessing,
    handleBookmarkURL,
    removeChecksumFromBookmarksObj,
    replaceBookmarksElementByGUIDAndWriteToBookmarksFile,
    getBookmarkFolderGUIDFromUsernameDealerNumber,
    getBookmarkUsernameFolderFromUniqueId,
    getUniqueIdPairsFromDealerBookmarkName,
};
