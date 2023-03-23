import fs from 'fs';
import chalk from 'chalk';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { waitForSeconds } from './sleep.js';
import { getRowPosOnTerminal } from './terminal.js';
import { gotoURL } from './goto.js';
import { getImagesFromContent } from './pageextraction.js';
import { getIgnoreBookmarkURLObjects, getAppDomain } from './configsupportive.js';
/* eslint-enable import/extensions */

const ignoreBookmarkURLObjects = getIgnoreBookmarkURLObjects();

async function handleBookmarkURL(page, lotIndex, username, dealerFolder, name, URL, debug = false) {
    const ignoreBookmarkURLObjectFindResults = ignoreBookmarkURLObjects.find((ignoreBookmarkURLObject) => {
        if (URL.startsWith(ignoreBookmarkURLObject.URLStartsWith)) {
            return true;
        }
        return false;
    });
    if (ignoreBookmarkURLObjectFindResults !== undefined) {
        console.log(chalk.magenta(`\t${name} : ${URL} : ${ignoreBookmarkURLObjectFindResults.ignoreMesgInConsole}`));
        return { result: false, bookmarkAppendMesg: ignoreBookmarkURLObjectFindResults.ignoreMesgInBookmark, imagesDownloaded: 0 };
    }

    const startingRow = await getRowPosOnTerminal();
    process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
    const endingRow = await getRowPosOnTerminal();
    const diffInRows = endingRow - startingRow;

    for (let gotoIndex = 0; gotoIndex < 24; gotoIndex++) {
        await gotoURL(page, URL, debug);
        if (page.url().startsWith(`${getAppDomain()}/dashboard?`)) {
            debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
            debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
            debug ? '' : process.stdout.cursorTo(0);
            process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)\n`));
            await waitForSeconds(5);
            return { result: false, bookmarkAppendMesg: 'Ignoring (Does not Exist)', imagesDownloaded: 0 };
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

    const returnObj = await getImagesFromContent(page, lotIndex, username, dealerFolder);
    // await waitForSeconds(10, true);
    return returnObj;
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
        }
    });
    return bookmarksObj;
}

// eslint-disable-next-line import/prefer-default-export
export { handleBookmarkURL, removeChecksumFromBookmarksObj, replaceBookmarksNameOnGUIDAndWriteToBookmarksFile };
