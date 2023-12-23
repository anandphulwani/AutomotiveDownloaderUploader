import fs from 'fs';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import { getChromeBookmark } from 'chrome-bookmark-reader';
import { URL as URLparser } from 'url';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { waitForSeconds } from './sleep.js';
import { getRowPosOnTerminal } from './terminal.js';
import { attainLock, releaseLock, lgc, lgb, lgi, lge, lgu, lgh, lgd, lgt, lgs, lgif } from './loggerandlocksupportive.js';
// import { createBackupOfFile } from './datastoresupportive.js';
import { gotoURL } from './goto.js';
import { getImagesFromContent } from './pageextraction.js';
import { getIgnoreBookmarkURLObjects, getAppDomain } from './configsupportive.js';
import { trimMultipleSpacesInMiddleIntoOne, allTrimString } from './stringformatting.js';
import { writeFileWithComparingSameLinesWithOldContents } from './filesystem.js';
import { printSectionSeperator } from './others.js';
import Color from '../class/Colors.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import LineSeparator from '../class/LineSeparator.js';
import { levels, loggerConsoleLevel } from './logger.js';
import { instanceRunDateFormatted } from './datetime.js';
import keyInYNWithTimeout from './keyInYNWithTimeout.js';
import { clearLastLinesOnConsole } from './consolesupportive.js';
/* eslint-enable import/extensions */

const ignoreBookmarkURLObjects = getIgnoreBookmarkURLObjects();

function reformatJSONString(contents) {
    const JSONObj = JSON.parse(contents);
    const JSONString = JSON.stringify(JSONObj, null, 3);
    return JSONString;
}

async function downloadBookmarksFromSourceToProcessing(debug = false) {
    lgt(`Fetching bookmarks from the source: `, Color.cyanNormal, LineSeparator.false);
    const { sourceBookmarkPath, processingBookmarkPathWithoutSync } = config;
    let initialSourceJSONString;
    let initialLineCount;
    let sourceJSONString;

    attainLock(sourceBookmarkPath, undefined, false);
    attainLock(processingBookmarkPathWithoutSync, undefined, false);
    lgt(`01:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false, LineSeparator.false);

    try {
        // Read the contents of both JSON files into memory
        const sourceContents = fs.readFileSync(sourceBookmarkPath, 'utf8');
        const processingContents = fs.readFileSync(processingBookmarkPathWithoutSync, 'utf8');

        lgt(`02:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false, LineSeparator.false);
        // Parse the contents of both JSON files into JavaScript objects
        let sourceObj;
        try {
            sourceObj = JSON.parse(sourceContents);
        } catch (err) {
            console.log('');
            lgs(`Source 'Bookmarks' file, is a corrupted JSON, cannot sync bookmarks from the source.`);
            return;
        }
        const processingObj = JSON.parse(processingContents);

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
        const downloadedRegexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ".* \\|#\\| .*"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
        const downloadedRegexExpression = new RegExp(downloadedRegexString, 'g');
        if (downloadedRegexExpression.test(processingJSONString)) {
            const downloadedBookmarkBlockMatches = processingJSONString.match(downloadedRegexExpression);
            debug ? lgd(`Found downloadedBookmarkBlockMatches: ${downloadedBookmarkBlockMatches.length}`) : null;

            if (downloadedBookmarkBlockMatches !== null) {
                const doneBookmarksInSource = {};
                for (let i = 0; i < downloadedBookmarkBlockMatches.length; i++) {
                    const match = downloadedBookmarkBlockMatches[i];

                    if (match.split(/\r\n|\r|\n/).length > 15) {
                        lgu(`Bookmarks URL Done Section: match's length is more than 15:\n${match}`);
                        process.exit(1);
                    }

                    const guid = match.match(/"guid": "(.*?)"/)[1];
                    debug ? lgd(`Found bookmark with GUID: ${guid}`) : null;
                    doneBookmarksInSource[guid] = match;
                }
                debug ? lgd(`Total doneBookmarksInSource: ${Object.keys(doneBookmarksInSource).length}`) : null;

                let isGUIDInProcessingBookmarksPresentInSourceBookmarks = false;
                const doneBookmarksInSourceKeys = Object.keys(doneBookmarksInSource);
                for (let i = 0; i < doneBookmarksInSourceKeys.length; i++) {
                    const guid = doneBookmarksInSourceKeys[i];

                    const GUIDRegexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
                    const GUIDRegexExpression = new RegExp(GUIDRegexString, 'g');

                    if (GUIDRegexExpression.test(sourceJSONString)) {
                        const GUIDBookmarkBlockMatches = sourceJSONString.match(GUIDRegexExpression);
                        if (GUIDBookmarkBlockMatches !== null) {
                            const GUIDBookmarkBlockMatch = GUIDBookmarkBlockMatches[0];
                            const nameInGUIDMatch = GUIDBookmarkBlockMatch.match(/"name": "(.*?)"/)[1];
                            doneBookmarksInSource[guid] = doneBookmarksInSource[guid].replace(
                                /("name": ")(.*?)( \|#\|.*")/,
                                `$1${nameInGUIDMatch}$3`
                            );
                            debug ? lgd(`Doing replacement for GUID: ${guid}`) : null;
                            sourceJSONString = sourceJSONString.replace(GUIDBookmarkBlockMatch, doneBookmarksInSource[guid]);
                            isGUIDInProcessingBookmarksPresentInSourceBookmarks = true;
                        }
                    }
                }

                if (!isGUIDInProcessingBookmarksPresentInSourceBookmarks) {
                    if (config.lotLastRunDate === instanceRunDateFormatted) {
                        console.log('');
                        printSectionSeperator(undefined, true);
                        const questionToRefreshBookmarksInSameDay =
                            'Fresh bookmarks added for today, all previous bookmarks state(bookmarks URL downloaded/bookmarks folder allotted) will be lost, continue?';
                        const resultOfKeyInYNToRefreshBookmarksInSameDay = await keyInYNWithTimeout(
                            questionToRefreshBookmarksInSameDay,
                            25000,
                            false
                        );
                        if (resultOfKeyInYNToRefreshBookmarksInSameDay.isDefaultOption) {
                            printSectionSeperator(undefined, true);
                            await waitForSeconds(5);
                            clearLastLinesOnConsole(2);
                        } else {
                            lgif(`${questionToRefreshBookmarksInSameDay}: ${resultOfKeyInYNToRefreshBookmarksInSameDay.answer}`);
                        }
                        if (!resultOfKeyInYNToRefreshBookmarksInSameDay.answer) {
                            releaseLock(processingBookmarkPathWithoutSync, undefined, false);
                            releaseLock(sourceBookmarkPath, undefined, false);
                            return;
                        }
                    }
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
        const allottedFolderRegexString = `[ ]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ".* \\|#\\| .*"(?:(?!"name": )[\\s|\\S])*?"type": "folder"`;
        const allottedFolderRegexExpression = new RegExp(allottedFolderRegexString, 'g');
        if (allottedFolderRegexExpression.test(processingJSONString)) {
            const allottedFolderBookmarkBlockMatches = processingJSONString.match(allottedFolderRegexExpression);
            if (allottedFolderBookmarkBlockMatches !== null) {
                const doneBookmarkFoldersInSource = {};
                // allottedFolderBookmarkBlockMatches.forEach((match) => {
                for (let i = 0; i < allottedFolderBookmarkBlockMatches.length; i++) {
                    const match = allottedFolderBookmarkBlockMatches[i];

                    if (match.split(/\r\n|\r|\n/).length > 9) {
                        lgu(`Bookmarks Folders Allotted Section: match's length is more than 9:\n${match}`);
                        process.exit(1);
                    }
                    const guid = match.match(/"guid": "(.*?)"/)[1];
                    debug ? lgd(`Found bookmark with GUID: ${guid}`) : null;
                    doneBookmarkFoldersInSource[guid] = match;
                }
                // });

                const doneBookmarksInSourceKeys = Object.keys(doneBookmarkFoldersInSource);
                for (let i = 0; i < doneBookmarksInSourceKeys.length; i++) {
                    const guid = doneBookmarksInSourceKeys[i];
                    const GUIDRegexString = `[ ]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"(?:(?!"guid": )[\\s|\\S])*?"type": "folder"`;
                    const GUIDRegexExpression = new RegExp(GUIDRegexString, 'g');

                    if (GUIDRegexExpression.test(sourceJSONString)) {
                        const GUIDBookmarkBlockMatches = sourceJSONString.match(GUIDRegexExpression);
                        if (GUIDBookmarkBlockMatches !== null) {
                            const GUIDBookmarkBlockMatch = GUIDBookmarkBlockMatches[0];
                            const nameInGUIDMatch = GUIDBookmarkBlockMatch.match(/"name": "(.*?)"/)[1];
                            debug ? lgd(doneBookmarkFoldersInSource[guid]) : null;
                            doneBookmarkFoldersInSource[guid] = doneBookmarkFoldersInSource[guid].replace(
                                /("name": ")(.*?)( \|#\|.*")/,
                                `$1${nameInGUIDMatch}$3`
                            );
                            debug ? lgd(doneBookmarkFoldersInSource[guid]) : null;
                            sourceJSONString = sourceJSONString.replace(GUIDBookmarkBlockMatch, doneBookmarkFoldersInSource[guid]);
                        }
                    }
                    debug ? lgd(`${guid}, ${doneBookmarkFoldersInSource[guid]}`) : null;
                }
            }
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
        writeFileWithComparingSameLinesWithOldContents(processingBookmarkPathWithoutSync, sourceJSONString, initialSourceJSONString);
        releaseLock(processingBookmarkPathWithoutSync, undefined, false);
        releaseLock(sourceBookmarkPath, undefined, false);
        lgt(`06:${logSymbols.success} `, Color.cyanNormal, LoggingPrefix.false);
        printSectionSeperator('trace');
    } catch (err) {
        lgu(initialSourceJSONString);
        printSectionSeperator();
        lgu(sourceJSONString);
        printSectionSeperator();
        lgu(`initialLineCount: ${initialLineCount}, finalLineCount: ${sourceJSONString.trim().split(/\r\n|\r|\n/).length}`);
        lgc(err);
        releaseLock(processingBookmarkPathWithoutSync, undefined, false);
        releaseLock(sourceBookmarkPath, undefined, false);
        process.exit(1);
    }
}

async function handleBookmarkURL(page, lotIndex, username, dealerFolder, name, URL, urlsDownloaded, debug = false) {
    if (name.includes(' |#| ')) {
        return { result: false, bookmarkAppendMesg: '', imagesDownloaded: 0, urlsDownloaded: urlsDownloaded };
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
    if (urlsDownloaded.includes(vehicleBookmarkUrlWOQueryParams)) {
        debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
        debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
        debug ? '' : process.stdout.cursorTo(0);
        lgh(`\t${name} : ${URL} : Supplied URL is a duplicate, already downloaded ...... (Ignoring)`);
        await waitForSeconds(5);
        return { result: false, bookmarkAppendMesg: 'Ignoring (Duplicate, Already downloaded)', imagesDownloaded: 0, urlsDownloaded: urlsDownloaded };
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
        urlsDownloaded.push(vehicleBookmarkUrlWOQueryParams);
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
    const fileToOperateOn = config.processingBookmarkPathWithoutSync;
    attainLock(fileToOperateOn, undefined, false);
    try {
        const fileContents = fs.readFileSync(fileToOperateOn, 'utf8');

        let bookmarksFileJSONObj = JSON.parse(fileContents);
        bookmarksFileJSONObj = removeChecksumFromBookmarksObj(bookmarksFileJSONObj);
        let bookmarksFileText = JSON.stringify(bookmarksFileJSONObj, null, 3);

        const blockRegexExpression = new RegExp(elementsDetails[element].blockRegex, 'g');
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
        const regexExpression = new RegExp(elementsDetails[element].elementRegex, 'g');
        if (elementsDetails[element].elementAlreadySubstituedCheckRegex) {
            const elementAlreadySubstituedCheckRegexExpression = new RegExp(elementsDetails[element].elementAlreadySubstituedCheckRegex, 'g');
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
    const { processingBookmarkPathWithoutSync, bookmarkOptions } = config;
    const bookmarks = getChromeBookmark(processingBookmarkPathWithoutSync, bookmarkOptions);
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
    filteredData = filteredData.filter(
        (usernameLevelBookmark) =>
            (usernameLevelBookmark.name.includes('@') ? usernameLevelBookmark.name.split('@')[0] : usernameLevelBookmark.name) === username
    );
    filteredData = filteredData[0].children;

    filteredData = filteredData.filter(
        (dealerLevelBookmark) =>
            allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerLevelBookmark.name)) ===
                allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerNumber)) ||
            allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerLevelBookmark.name)).startsWith(
                `${allTrimString(trimMultipleSpacesInMiddleIntoOne(dealerNumber))} |#| `
            )
    );
    return filteredData[0].guid;
}

function getBookmarkUsernameFolderFromUniqueId(uniqueId) {
    const { processingBookmarkPathWithoutSync, bookmarkOptions } = config;
    const bookmarks = getChromeBookmark(processingBookmarkPathWithoutSync, bookmarkOptions);
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
