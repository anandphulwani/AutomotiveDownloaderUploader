import fs from 'fs';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import { getChromeBookmark } from 'chrome-bookmark-reader';
import { URL as URLparser } from 'url';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { waitForSeconds } from './sleep.js';
import { getRowPosOnTerminal } from './terminal.js';
import { lgc } from './loggersupportive.js';
import { attainLock, releaseLock } from './locksupportive.js';
import { createBackupOfFile } from './datastoresupportive.js';
import { gotoURL } from './goto.js';
import { getImagesFromContent } from './pageextraction.js';
import { getIgnoreBookmarkURLObjects, getAppDomain } from './configsupportive.js';
import { trimMultipleSpacesInMiddleIntoOne, allTrimString } from './stringformatting.js';
/* eslint-enable import/extensions */

const ignoreBookmarkURLObjects = getIgnoreBookmarkURLObjects();

async function downloadBookmarksFromSourceToProcessing() {
    const { sourceBookmarkPath, processingBookmarkPathWithoutSync } = config;
    attainLock(sourceBookmarkPath, true);
    attainLock(processingBookmarkPathWithoutSync, true);

    try {
        // Read the contents of both JSON files into memory
        const sourceContents = fs.readFileSync(sourceBookmarkPath, 'utf8');
        const processingContents = fs.readFileSync(processingBookmarkPathWithoutSync, 'utf8');

        // Parse the contents of both JSON files into JavaScript objects
        const sourceObj = JSON.parse(sourceContents);
        const processingObj = JSON.parse(processingContents);

        // eslint-disable-next-line no-restricted-syntax
        for (const key in sourceObj.roots) {
            if (key !== 'bookmark_bar') {
                delete sourceObj.roots[key];
            }
        }

        let sourceJSONString = JSON.stringify(sourceObj, null, 3);
        const processingJSONString = JSON.stringify(processingObj, null, 3);

        const initalSourceJSONString = sourceJSONString;
        const initalLineCount = sourceJSONString.split(/\r\n|\r|\n/).length;

        /**
         * Copying the names of bookmarks which are done
         */
        const downloadedRegexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ".* \\|#\\| .*"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
        const downloadedRegexExpression = new RegExp(downloadedRegexString, 'g');
        if (downloadedRegexExpression.test(processingJSONString)) {
            // lgc('Unable to match regex for fn downloadBookmarksFromSourceToProcessing() Block 1');
            // process.exit(1);

            const downloadedBookmarkBlockMatches = processingJSONString.match(downloadedRegexExpression);
            console.log(`Found downloadedBookmarkBlockMatches: ${downloadedBookmarkBlockMatches.length}`);

            if (downloadedBookmarkBlockMatches !== null) {
                const doneBookmarksInSource = {};
                for (let i = 0; i < downloadedBookmarkBlockMatches.length; i++) {
                    const match = downloadedBookmarkBlockMatches[i];

                    if (match.split(/\r\n|\r|\n/).length > 15) {
                        console.log(match);
                        releaseLock(processingBookmarkPathWithoutSync, true);
                        releaseLock(sourceBookmarkPath, true);
                        process.exit(0);
                    }

                    const guid = match.match(/"guid": "(.*?)"/)[1];
                    // console.log(`Found bookmark with GUID: ${guid}`);
                    doneBookmarksInSource[guid] = match;
                }
                console.log(`Total doneBookmarksInSource: ${Object.keys(doneBookmarksInSource).length}`);

                const doneBookmarksInSourceKeys = Object.keys(doneBookmarksInSource);
                for (let i = 0; i < doneBookmarksInSourceKeys.length; i++) {
                    const guid = doneBookmarksInSourceKeys[i];

                    const GUIDRegexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
                    const GUIDRegexExpression = new RegExp(GUIDRegexString, 'g');

                    if (GUIDRegexExpression.test(sourceJSONString)) {
                        // lgc('Unable to match regex for fn downloadBookmarksFromSourceToProcessing() Block 2');
                        // process.exit(1);
                        const GUIDBookmarkBlockMatches = sourceJSONString.match(GUIDRegexExpression);
                        if (GUIDBookmarkBlockMatches !== null) {
                            const GUIDBookmarkBlockMatch = GUIDBookmarkBlockMatches[0];
                            const nameInGUIDMatch = GUIDBookmarkBlockMatch.match(/"name": "(.*?)"/)[1];
                            doneBookmarksInSource[guid] = doneBookmarksInSource[guid].replace(
                                /("name": ")(.*?)( \|#\|.*")/,
                                `$1${nameInGUIDMatch}$3`
                            );
                            // console.log(`Doing replacement for GUID: ${guid}`);
                            sourceJSONString = sourceJSONString.replace(GUIDBookmarkBlockMatch, doneBookmarksInSource[guid]);
                        }
                    }
                }
            }
        }
        sourceJSONString = JSON.parse(sourceJSONString);
        sourceJSONString = removeChecksumFromBookmarksObj(sourceJSONString);
        sourceJSONString = JSON.stringify(sourceJSONString, null, 3);

        if (Math.abs(initalLineCount - sourceJSONString.split(/\r\n|\r|\n/).length) > 1) {
            console.log(initalSourceJSONString);
            console.log(`${'-'.repeat(70)}`);
            console.log(sourceJSONString);
            console.log(`${'-'.repeat(70)}`);
            console.log(`initalLineCount: ${initalLineCount}, finalLineCount: ${sourceJSONString.split(/\r\n|\r|\n/).length}`);
            releaseLock(processingBookmarkPathWithoutSync, true);
            releaseLock(sourceBookmarkPath, true);
            process.exit(0);
        }

        /**
         * Copying the names of bookmarks folders which are done
         */
        const allotedFolderRegexString = `[ ]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ".* \\|#\\| .*"(?:(?!"name": )[\\s|\\S])*?"type": "folder"`;
        const allotedFolderRegexExpression = new RegExp(allotedFolderRegexString, 'g');
        if (allotedFolderRegexExpression.test(processingJSONString)) {
            // lgc('Unable to match regex for fn downloadBookmarksFromSourceToProcessing() Block 3');
            // process.exit(1);

            const allotedFolderBookmarkBlockMatches = processingJSONString.match(allotedFolderRegexExpression);

            if (allotedFolderBookmarkBlockMatches !== null) {
                const doneBookmarkFoldersInSource = {};
                // allotedFolderBookmarkBlockMatches.forEach((match) => {
                for (let i = 0; i < allotedFolderBookmarkBlockMatches.length; i++) {
                    const match = allotedFolderBookmarkBlockMatches[i];

                    if (match.split(/\r\n|\r|\n/).length > 9) {
                        console.log(match);
                        releaseLock(processingBookmarkPathWithoutSync, true);
                        releaseLock(sourceBookmarkPath, true);
                        process.exit(0);
                    }
                    const guid = match.match(/"guid": "(.*?)"/)[1];
                    // console.log(`Found bookmark with GUID: ${guid}`);
                    doneBookmarkFoldersInSource[guid] = match;
                }
                // });

                const doneBookmarksInSourceKeys = Object.keys(doneBookmarkFoldersInSource);
                for (let i = 0; i < doneBookmarksInSourceKeys.length; i++) {
                    const guid = doneBookmarksInSourceKeys[i];
                    const GUIDRegexString = `[ ]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"(?:(?!"guid": )[\\s|\\S])*?"type": "folder"`;
                    const GUIDRegexExpression = new RegExp(GUIDRegexString, 'g');

                    if (GUIDRegexExpression.test(sourceJSONString)) {
                        // lgc('Unable to match regex for fn downloadBookmarksFromSourceToProcessing() Block 4');
                        // process.exit(1);

                        const GUIDBookmarkBlockMatches = sourceJSONString.match(GUIDRegexExpression);
                        if (GUIDBookmarkBlockMatches !== null) {
                            const GUIDBookmarkBlockMatch = GUIDBookmarkBlockMatches[0];
                            const nameInGUIDMatch = GUIDBookmarkBlockMatch.match(/"name": "(.*?)"/)[1];
                            // console.log(doneBookmarkFoldersInSource[guid]);
                            doneBookmarkFoldersInSource[guid] = doneBookmarkFoldersInSource[guid].replace(
                                /("name": ")(.*?)( \|#\|.*")/,
                                `$1${nameInGUIDMatch}$3`
                            );
                            // console.log(doneBookmarkFoldersInSource[guid]);
                            sourceJSONString = sourceJSONString.replace(GUIDBookmarkBlockMatch, doneBookmarkFoldersInSource[guid]);
                        }
                    }
                    // console.log(guid, doneBookmarksInSource[guid]);
                }
            }
        }
        sourceJSONString = JSON.parse(sourceJSONString);
        sourceJSONString = removeChecksumFromBookmarksObj(sourceJSONString);
        sourceJSONString = JSON.stringify(sourceJSONString, null, 3);

        if (Math.abs(initalLineCount - sourceJSONString.split(/\r\n|\r|\n/).length) > 1) {
            console.log(initalSourceJSONString);
            console.log(`${'-'.repeat(70)}`);
            console.log(sourceJSONString);
            console.log(`${'-'.repeat(70)}`);
            console.log(`initalLineCount: ${initalLineCount}, finalLineCount: ${sourceJSONString.split(/\r\n|\r|\n/).length}`);
            releaseLock(processingBookmarkPathWithoutSync, true);
            releaseLock(sourceBookmarkPath, true);
            process.exit(0);
        }

        console.log('Writing bookmarks file');
        fs.writeFileSync(processingBookmarkPathWithoutSync, sourceJSONString);
        releaseLock(processingBookmarkPathWithoutSync, true);
        releaseLock(sourceBookmarkPath, true);
    } catch (err) {
        console.log(`${err.message}`);
        releaseLock(processingBookmarkPathWithoutSync, true);
        releaseLock(sourceBookmarkPath, true);
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
        console.log(chalk.magenta(`\t${name} : ${URL} : ${ignoreBookmarkURLObjectFindResults.ignoreMesgInConsole}`));
        return {
            result: false,
            bookmarkAppendMesg: ignoreBookmarkURLObjectFindResults.ignoreMesgInBookmark,
            imagesDownloaded: 0,
            urlsDownloaded: urlsDownloaded,
        };
    }

    const startingRow = await getRowPosOnTerminal();
    process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;

    let vehicleBookmarkUrlWOQueryParams = new URLparser(URL);
    vehicleBookmarkUrlWOQueryParams = vehicleBookmarkUrlWOQueryParams.host + vehicleBookmarkUrlWOQueryParams.pathname;
    if (urlsDownloaded.includes(vehicleBookmarkUrlWOQueryParams)) {
        debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
        debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
        debug ? '' : process.stdout.cursorTo(0);
        process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL is a duplicate, already downloaded ...... (Ignoring)\n`));
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
        process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)\n`));
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

function replaceBookmarksNameOnGUIDAndWriteToBookmarksFileWrapper(guid, appendText) {
    const fileToOperateOn = config.processingBookmarkPathWithoutSync;
    attainLock(fileToOperateOn, true);

    const returnObj = replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(guid, appendText);

    releaseLock(fileToOperateOn, true);
    if (returnObj.exit) {
        process.exit(returnObj.exit);
    }
}

function replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(guid, appendText) {
    const fileToOperateOn = config.processingBookmarkPathWithoutSync;

    try {
        const bookmarksText = fs.readFileSync(fileToOperateOn);
        let bookmarksJSONObj = JSON.parse(bookmarksText);
        bookmarksJSONObj = removeChecksumFromBookmarksObj(bookmarksJSONObj);
        let bookmarkText = JSON.stringify(bookmarksJSONObj, null, 3);

        const regexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
        const regexExpression = new RegExp(regexString, 'g');

        if (!regexExpression.test(bookmarkText)) {
            lgc('Unable to match regex for fn replaceBookmarksNameOnGUIDAndWriteToBookmarksFile()');
            process.exit(1);
        }

        const initalBookmarkTest = bookmarkText;
        const initalLineCount = bookmarkText.split(/\r\n|\r|\n/).length;
        const bookmarkBlockText = bookmarkText.match(regexExpression)[0];
        const bookmarkBlockObj = JSON.parse(bookmarkBlockText);
        bookmarkBlockObj.name = `${bookmarkBlockObj.name} |#| ${appendText}`;
        const bookmarkBlockNewText = JSON.stringify(bookmarkBlockObj);

        bookmarkText = bookmarkText.replace(bookmarkBlockText, bookmarkBlockNewText);
        bookmarksJSONObj = JSON.parse(bookmarkText);
        if (Math.abs(initalLineCount - JSON.stringify(bookmarksJSONObj, null, 3).split(/\r\n|\r|\n/).length) > 1) {
            console.log(initalBookmarkTest);
            console.log(`${'-'.repeat(70)}`);
            console.log(JSON.stringify(bookmarksJSONObj, null, 3));
            console.log(`${'-'.repeat(70)}`);
            console.log(
                `initalLineCount: ${initalLineCount}, finalLineCount: ${JSON.stringify(bookmarksJSONObj, null, 3).split(/\r\n|\r|\n/).length}`
            );
            process.exit(0);
        }
        fs.writeFileSync(fileToOperateOn, JSON.stringify(bookmarksJSONObj, null, 3));
        createBackupOfFile(fileToOperateOn, JSON.stringify(bookmarksJSONObj, null, 3));
    } catch (err) {
        console.log(`${err.message}`);
        process.exit(1);
    }
}

async function replaceBookmarksFolderNameOnGUIDAndWriteToBookmarksFile(guid, appendText, useLockingMechanism = true) {
    const fileToOperateOn = config.processingBookmarkPathWithoutSync;
    if (useLockingMechanism) {
        attainLock(fileToOperateOn, true);
    }

    try {
        const processingContents = fs.readFileSync(fileToOperateOn, 'utf8');
        let bookmarksObj = JSON.parse(processingContents);
        bookmarksObj = removeChecksumFromBookmarksObj(bookmarksObj);
        let bookmarkText = JSON.stringify(bookmarksObj, null, 3);

        const regexString = `[ ]*"date_added"[^\\{\\}\\]\\[]*?"guid": "${guid}",[^\\{\\}\\]\\[]*?"type": "folder"`;
        const regexExpression = new RegExp(regexString, 'g');

        if (!regexExpression.test(bookmarkText)) {
            lgc('Unable to match regex for fn replaceBookmarksFolderNameOnGUIDAndWriteToBookmarksFile()');
            process.exit(1);
        }

        const bookmarkBlockText = bookmarkText.match(regexExpression)[0];

        const nameRegexString = `"name": "(.*)"`;
        const nameRegexExpression = new RegExp(nameRegexString, 'g');
        let newBookmarkBlockText;
        if (!/"name": .* \|#\| .*/.test(bookmarkBlockText)) {
            newBookmarkBlockText = bookmarkBlockText.replace(nameRegexExpression, `"name": "$1 |#| ${appendText}"`);
        } else {
            newBookmarkBlockText = bookmarkBlockText.replace(nameRegexExpression, `"name": "$1,${appendText}"`);
        }

        bookmarkText = bookmarkText.replace(bookmarkBlockText, newBookmarkBlockText);
        bookmarksObj = JSON.parse(bookmarkText);
        fs.writeFileSync(fileToOperateOn, JSON.stringify(bookmarksObj, null, 3));
        createBackupOfFile(fileToOperateOn, JSON.stringify(bookmarksObj, null, 3));
        if (useLockingMechanism) {
            releaseLock(fileToOperateOn, true);
        }
        return bookmarksObj;
    } catch (err) {
        console.log(`${err.message}`);
        process.exit(1);
    }
    return false;
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
    replaceBookmarksNameOnGUIDAndWriteToBookmarksFile,
    replaceBookmarksFolderNameOnGUIDAndWriteToBookmarksFile,
    getBookmarkFolderGUIDFromUsernameDealerNumber,
    getBookmarkUsernameFolderFromUniqueId,
    getUniqueIdPairsFromDealerBookmarkName,
};
