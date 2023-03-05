import chalk from 'chalk';

/* eslint-disable import/extensions */
import { waitForSeconds } from './sleep.js';
import { getRowPosOnTerminal } from './terminal.js';
import { gotoURL } from './goto.js';
import { getImagesFromContent } from './pageextraction.js';
/* eslint-enable import/extensions */

async function handleBookmarkURL(page, dealerFolder, name, URL, debug = false) {
    if (URL.startsWith('https://www.homenetiol.com/inventory/photo-manager?')) {
        console.log(chalk.magenta(`\t${name} : ${URL} : Photo Manager URL ...... (Ignoring)`));
    } else if (URL.startsWith('https://www.homenetiol.com/reporting/photo-upload?')) {
        console.log(chalk.magenta(`\t${name} : ${URL} : Photo Upload URL ...... (Ignoring)`));
    } else {
        const startingRow = await getRowPosOnTerminal();
        process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
        const endingRow = await getRowPosOnTerminal();
        const diffInRows = endingRow - startingRow;
        await gotoURL(page, URL, debug);
        if (page.url().startsWith('https://www.homenetiol.com/dashboard?')) {
            debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
            debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
            debug ? '' : process.stdout.cursorTo(0);
            process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)\n`));
            await waitForSeconds(5);
        } else {
            await getImagesFromContent(page, dealerFolder);
            // await waitForSeconds(10, true);
        }
    }
}

// eslint-disable-next-line import/prefer-default-export
export { handleBookmarkURL };
