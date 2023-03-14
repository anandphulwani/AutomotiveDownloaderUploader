import fs from 'fs';
import chalk from 'chalk';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { waitForSeconds } from './sleep.js';
import { getRowPosOnTerminal } from './terminal.js';
import { gotoURL } from './goto.js';
import { getImagesFromContent } from './pageextraction.js';
import { getignoreBookmarkURLObjects, getAppDomain } from './configsupportive.js';
/* eslint-enable import/extensions */

const ignoreBookmarkURLObjects = getignoreBookmarkURLObjects();

async function handleBookmarkURL(page, dealerFolder, name, URL, debug = false) {
    const ignoreBookmarkURLObjectFindResults = ignoreBookmarkURLObjects.find((ignoreBookmarkURLObject) => {
        if (URL.startsWith(ignoreBookmarkURLObject.URLStartsWith)) {
            return true;
        }
        return false;
    });
    if (ignoreBookmarkURLObjectFindResults !== undefined) {
        console.log(chalk.magenta(`\t${name} : ${URL} : ${ignoreBookmarkURLObjectFindResults.ignoreMesgInConsole}`));
        return ignoreBookmarkURLObjectFindResults.ignoreMesgInBookmark;
    }

    const startingRow = await getRowPosOnTerminal();
    process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;
    await gotoURL(page, URL, debug);
    if (page.url().startsWith(`${getAppDomain()}/dashboard?`)) {
        debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
        debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
        debug ? '' : process.stdout.cursorTo(0);
        process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)\n`));
        await waitForSeconds(5);
        return 'Ignoring (Does not Exist)';
    }
    const stockNumber = await getImagesFromContent(page, dealerFolder);
    // await waitForSeconds(10, true);
    return stockNumber;
}

function removeChecksumFromBookmarksObj(bookmarksObj) {
    const jsonString = JSON.stringify(bookmarksObj).replace(/\{(?:(?!\{).)*?"checksum":".*?".*?,/g, '{');
    return JSON.parse(jsonString);
}

function replaceBookmarksNameOnGUIDAndWriteToBookmarksFile(bookmarkPath, bookmarksObj, guid, appendText) {
    const regexString = `{(?:(?!{).)*?"guid":"${guid}".*?}`;
    const regexExpression = new RegExp(regexString, 'g');

    let bookmarkText = JSON.stringify(bookmarksObj);
    const bookmarkBlockText = bookmarkText.match(regexExpression)[0];
    const bookmarkBlockObj = JSON.parse(bookmarkBlockText);
    bookmarkBlockObj.name = `${bookmarkBlockObj.name} |#| ${appendText}`;
    const bookmarkBlockNewText = JSON.stringify(bookmarkBlockObj);

    bookmarkText = bookmarkText.replace(bookmarkBlockText, bookmarkBlockNewText);
    bookmarksObj = JSON.parse(bookmarkText);
    fs.writeFileSync(bookmarkPath, JSON.stringify(bookmarksObj, null, 3), (err) => {
        if (err) {
            console.log(err);
        } else {
            console.log(`JSON saved to ${bookmarkPath}`);
        }
    });
    return bookmarksObj;
}

// eslint-disable-next-line import/prefer-default-export
export { handleBookmarkURL, removeChecksumFromBookmarksObj, replaceBookmarksNameOnGUIDAndWriteToBookmarksFile };
