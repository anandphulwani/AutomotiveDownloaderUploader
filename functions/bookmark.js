import fs from 'fs';
import chalk from 'chalk';
import logSymbols from 'log-symbols';
import { lockSync, unlockSync, checkSync } from 'proper-lockfile';
import { getChromeBookmark } from 'chrome-bookmark-reader';
import { URL as URLparser } from 'url';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { waitForMilliSeconds, waitForSeconds } from './sleep.js';
import { getRowPosOnTerminal } from './terminal.js';
import { gotoURL } from './goto.js';
import { getImagesFromContent } from './pageextraction.js';
import { getIgnoreBookmarkURLObjects, getAppDomain } from './configsupportive.js';
import { trimMultipleSpacesInMiddleIntoOne, allTrimString } from './stringformatting.js';
/* eslint-enable import/extensions */

const ignoreBookmarkURLObjects = getIgnoreBookmarkURLObjects();

async function downloadBookmarksFromSourceToProcessing() {
    const { sourceBookmarkPath, processingBookmarkPathWithoutSync } = config;
    for (let lockTryIndex = 0; lockTryIndex <= 10; lockTryIndex++) {
        try {
            if (lockTryIndex === 10) {
                throw new Error('Unable to get lock for the file after 10 retries.');
            }
            const checkLockSourceBookmarkPath = checkSync(sourceBookmarkPath);
            const checkLockProcessingBookmarkPathWithoutSync = checkSync(processingBookmarkPathWithoutSync);
            if (checkLockSourceBookmarkPath && checkLockProcessingBookmarkPathWithoutSync) {
                await waitForMilliSeconds(200);
            } else {
                lockSync(sourceBookmarkPath);
                lockSync(processingBookmarkPathWithoutSync);

                // Read the contents of both JSON files into memory
                const sourceContents = fs.readFileSync(sourceBookmarkPath, 'utf8');
                const processingContents = fs.readFileSync(processingBookmarkPathWithoutSync, 'utf8');

                // Parse the contents of both JSON files into JavaScript objects
                const sourceObj = JSON.parse(sourceContents);
                const processingObj = JSON.parse(processingContents);

                let sourceJSONString = JSON.stringify(sourceObj, null, 3);
                const initalSourceJSONString = sourceJSONString;
                const initalLineCount = sourceJSONString.split(/\r\n|\r|\n/).length;
                const processingJSONString = JSON.stringify(processingObj, null, 3);

                /**
                 * Copying the names of bookmarks which are done
                 */
                const downloadedRegexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ".* \\|#\\| .*"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
                const downloadedRegexExpression = new RegExp(downloadedRegexString, 'g');
                const downloadedBookmarkBlockMatches = processingJSONString.match(downloadedRegexExpression);

                if (downloadedBookmarkBlockMatches !== null) {
                    const doneBookmarksInSource = [];
                    downloadedBookmarkBlockMatches.forEach((match) => {
                        if (match.split(/\r\n|\r|\n/).length > 15) {
                            console.log(match);
                            unlockSync(processingBookmarkPathWithoutSync);
                            unlockSync(sourceBookmarkPath);
                            process.exit(0);
                        }
                        const guid = match.match(/"guid": "(.*?)"/)[1];
                        // console.log(`Found bookmark with GUID: ${guid}`);
                        doneBookmarksInSource[guid] = match;
                    });

                    Object.keys(doneBookmarksInSource).forEach((guid) => {
                        const GUIDRegexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
                        const GUIDRegexExpression = new RegExp(GUIDRegexString, 'g');

                        const GUIDBookmarkBlockMatches = sourceJSONString.match(GUIDRegexExpression);
                        if (GUIDBookmarkBlockMatches !== null) {
                            const GUIDBookmarkBlockMatch = GUIDBookmarkBlockMatches[0];
                            sourceJSONString = sourceJSONString.replace(GUIDBookmarkBlockMatch, doneBookmarksInSource[guid]);
                        }
                        // console.log(guid, doneBookmarksInSource[guid]);
                    });
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
                    unlockSync(processingBookmarkPathWithoutSync);
                    unlockSync(sourceBookmarkPath);
                    process.exit(0);
                }

                /**
                 * Copying the names of bookmarks folders which are done
                 */
                const allotedFolderRegexString = `[ ]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "(.*)"(?:(?!"guid": )[\\s|\\S])*?"name": ".* \\|#\\| .*"(?:(?!"name": )[\\s|\\S])*?"type": "folder"`;
                const allotedFolderRegexExpression = new RegExp(allotedFolderRegexString, 'g');
                const allotedFolderBookmarkBlockMatches = processingJSONString.match(allotedFolderRegexExpression);

                if (allotedFolderBookmarkBlockMatches !== null) {
                    const doneBookmarkFoldersInSource = [];
                    allotedFolderBookmarkBlockMatches.forEach((match) => {
                        if (match.split(/\r\n|\r|\n/).length > 9) {
                            console.log(match);
                            unlockSync(processingBookmarkPathWithoutSync);
                            unlockSync(sourceBookmarkPath);
                            process.exit(0);
                        }
                        const guid = match.match(/"guid": "(.*?)"/)[1];
                        // console.log(`Found bookmark with GUID: ${guid}`);
                        doneBookmarkFoldersInSource[guid] = match;
                    });

                    Object.keys(doneBookmarkFoldersInSource).forEach((guid) => {
                        const GUIDRegexString = `[ ]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"(?:(?!"guid": )[\\s|\\S])*?"type": "folder"`;
                        const GUIDRegexExpression = new RegExp(GUIDRegexString, 'g');

                        const GUIDBookmarkBlockMatches = sourceJSONString.match(GUIDRegexExpression);
                        if (GUIDBookmarkBlockMatches !== null) {
                            const GUIDBookmarkBlockMatch = GUIDBookmarkBlockMatches[0];
                            sourceJSONString = sourceJSONString.replace(GUIDBookmarkBlockMatch, doneBookmarkFoldersInSource[guid]);
                        }
                        // console.log(guid, doneBookmarksInSource[guid]);
                    });
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
                    unlockSync(processingBookmarkPathWithoutSync);
                    unlockSync(sourceBookmarkPath);
                    process.exit(0);
                }

                fs.writeFileSync(processingBookmarkPathWithoutSync, sourceJSONString, (err) => {
                    if (err) {
                        console.log(err);
                        unlockSync(processingBookmarkPathWithoutSync);
                        unlockSync(sourceBookmarkPath);
                        process.exit(1);
                    }
                });
                unlockSync(processingBookmarkPathWithoutSync);
                unlockSync(sourceBookmarkPath);
                break;
            }
        } catch (err) {
            console.log(`${err.message}`);
            if (checkSync(processingBookmarkPathWithoutSync)) {
                unlockSync(processingBookmarkPathWithoutSync);
            }
            if (checkSync(sourceBookmarkPath)) {
                unlockSync(sourceBookmarkPath);
            }
            process.exit(1);
        }
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

async function replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(guid, appendText) {
    for (let lockTryIndex = 0; lockTryIndex <= 10; lockTryIndex++) {
        try {
            if (lockTryIndex === 10) {
                throw new Error('Unable to get lock for the file after 10 retries.');
            }
            const checkLock = checkSync(config.processingBookmarkPathWithoutSync);
            if (checkLock) {
                await waitForMilliSeconds(200);
            } else {
                lockSync(config.processingBookmarkPathWithoutSync);

                const bookmarksText = fs.readFileSync(config.processingBookmarkPathWithoutSync);
                let bookmarksJSONObj = JSON.parse(bookmarksText);
                bookmarksJSONObj = removeChecksumFromBookmarksObj(bookmarksJSONObj);

                // const regexString = `{(?:(?!{).)*?"guid":"${guid}".*?}`;
                const regexString = `{[\\s]*"date_added"(?:(?!"date_added")[\\s|\\S])*?"guid": "${guid}"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
                // const regexString = `{\\s*"date_added"[\\s|\\S]*?"guid": "${guid}"[\\s|\\S]*?"url": ".*"\\n[\\s]*}`;
                // console.log(regexString);
                const regexExpression = new RegExp(regexString, 'g');

                let bookmarkText = JSON.stringify(bookmarksJSONObj, null, 3);
                const initalBookmarkTest = bookmarkText;
                const initalLineCount = bookmarkText.split(/\r\n|\r|\n/).length;
                // console.log(bookmarkText);
                const bookmarkBlockText = bookmarkText.match(regexExpression)[0];
                // console.log(`${'-'.repeat(70)} Start 01`);
                // console.log(bookmarkBlockText);
                // console.log(`${'-'.repeat(70)} End 01`);
                const bookmarkBlockObj = JSON.parse(bookmarkBlockText);
                // console.log(`${'-'.repeat(70)} Start 02`);
                // console.log(bookmarkBlockObj);
                // console.log(`${'-'.repeat(70)} End 02`);
                bookmarkBlockObj.name = `${bookmarkBlockObj.name} |#| ${appendText}`;
                // console.log(`${'-'.repeat(70)} Start 03`);
                // console.log(bookmarkBlockObj);
                // console.log(`${'-'.repeat(70)} End 03`);
                const bookmarkBlockNewText = JSON.stringify(bookmarkBlockObj);
                // console.log(`${'-'.repeat(70)} Start 04`);
                // console.log(bookmarkBlockNewText);
                // console.log(`${'-'.repeat(70)} End 04`);

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
                    unlockSync(config.processingBookmarkPathWithoutSync);
                    process.exit(0);
                }
                fs.writeFileSync(config.processingBookmarkPathWithoutSync, JSON.stringify(bookmarksJSONObj, null, 3), (err) => {
                    if (err) {
                        unlockSync(config.processingBookmarkPathWithoutSync);
                        console.log(err);
                        process.exit(1);
                    }
                });
                unlockSync(config.processingBookmarkPathWithoutSync);
                break;
            }
        } catch (err) {
            console.log(`${err.message}`);
            if (checkSync(config.processingBookmarkPathWithoutSync)) {
                unlockSync(config.processingBookmarkPathWithoutSync);
            }
            process.exit(1);
        }
    }
}

async function replaceBookmarksFolderNameOnGUIDAndWriteToBookmarksFile(guid, appendText) {
    for (let lockTryIndex = 0; lockTryIndex <= 10; lockTryIndex++) {
        try {
            if (lockTryIndex === 10) {
                throw new Error('Unable to get lock for the file after 10 retries.');
            }
            const checkLock = checkSync(config.processingBookmarkPathWithoutSync);
            if (checkLock) {
                await waitForMilliSeconds(200);
            } else {
                lockSync(config.processingBookmarkPathWithoutSync);
                const processingContents = fs.readFileSync(config.processingBookmarkPathWithoutSync, 'utf8');
                let bookmarksObj = JSON.parse(processingContents);
                bookmarksObj = removeChecksumFromBookmarksObj(bookmarksObj);

                const regexString = `[ ]*"date_added"[^\\{\\}\\]\\[]*?"guid": "${guid}",[^\\{\\}\\]\\[]*?"type": "folder"`;
                const regexExpression = new RegExp(regexString, 'g');

                let bookmarkText = JSON.stringify(bookmarksObj, null, 3);
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
                fs.writeFileSync(config.processingBookmarkPathWithoutSync, JSON.stringify(bookmarksObj, null, 3), (err) => {
                    if (err) {
                        console.log(err);
                        unlockSync(config.processingBookmarkPathWithoutSync);
                        process.exit(1);
                    }
                });
                unlockSync(config.processingBookmarkPathWithoutSync);
                return bookmarksObj;
            }
        } catch (err) {
            console.log(`${err.message}`);
            if (checkSync(config.processingBookmarkPathWithoutSync)) {
                unlockSync(config.processingBookmarkPathWithoutSync);
            }
            process.exit(1);
        }
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
