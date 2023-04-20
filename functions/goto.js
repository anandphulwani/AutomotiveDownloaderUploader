import chalk from 'chalk';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { waitForSeconds } from './sleep.js';
import { incRetryCount } from './others.js';
import { waitTillCurrentURLStartsWith, waitTillCurrentURLEndsWith } from './waiting.js';
/* eslint-enable import/extensions */

async function gotoURL(page, URL, debug = false) {
    debug ? console.log(`Navigating to the URL: ${URL}: Executing.`) : '';
    for (let gotoCnt = 0; gotoCnt < 5; gotoCnt++) {
        try {
            await page.goto(URL, { timeout: 60 * 1000 }); // waitUntil: 'load',
            // await page.goto(URL, { timeout: 10 }); // waitUntil: 'load',
            // await page.goto(URL, { waitUntil: "networkidle2" }); //LOWPRIORITY: Add networkidle0, networkidle2 and other multiple modes
            break;
        } catch (err) {
            if (
                err.message.match(/Navigation timeout of \d* ms exceeded/g) ||
                err.message.match(/net::ERR_CONNECTION_TIMED_OUT at .*/g) ||
                err.message === 'socket hang up' ||
                err.message === 'aborted' ||
                err.message === 'read ECONNRESET' ||
                err.message === 'Page.navigate timed out.'
            ) {
                console.log(`SUCCESSFULLY ERROR HANDLED (WITHOUT HASH):#${err.message}#`);
                process.stdout.write(chalk.yellow.bold(` ${logSymbols.warning}`));
                if (gotoCnt < 4) {
                    // Sleep for 30 seconds
                    for (let cnt = 0; cnt < 10; cnt++) {
                        process.stdout.write(chalk.yellow.bold('.'));
                        await waitForSeconds(3);
                    }
                    incRetryCount();
                } else {
                    console.log(
                        chalk.white.bgRed.bold(
                            `\nUnable to get the following URL after 5 retries in interval of 30 seconds each, get operation timeout set to 60 seconds: ${URL} .`
                        )
                    );
                    process.stdout.write('  ');
                }
            } else {
                console.log(`CATCH THIS ERROR (WITHOUT HASH):#${err.message}#`);
                throw err;
            }
        }
    }
    debug ? console.log(`Navigating to the URL: ${URL}: Done.`) : '';
    return page.url();
}

async function gotoPageAndWaitTillCurrentURLStartsWith(page, URL, partialURL = URL, debug = false) {
    await gotoURL(page, URL, debug);
    await waitTillCurrentURLStartsWith(page, partialURL, debug);
}

async function gotoPageAndWaitTillCurrentURLEndsWith(page, URL, partialURL = URL, debug = false) {
    await gotoURL(page, URL, debug);
    await waitTillCurrentURLEndsWith(page, partialURL, debug);
}

export { gotoURL, gotoPageAndWaitTillCurrentURLStartsWith, gotoPageAndWaitTillCurrentURLEndsWith };
