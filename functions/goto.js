import chalk from 'chalk';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { waitForSeconds } from './sleep.js';
import { incRetryCount } from './others.js';
import { waitTillCurrentURLStartsWith, waitTillCurrentURLEndsWith } from './waiting.js';
import { lgbf, lgc, lgd, lge, lgi, lgu } from './loggerandlocksupportive.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
/* eslint-enable import/extensions */

async function gotoURL(page, URL, debug = false) {
    debug ? lgd(`Navigating to the URL: ${URL}: Executing.`) : null;
    for (let gotoCnt = 0; gotoCnt < 5; gotoCnt++) {
        try {
            // ONPROJECTFINISH: Error 500 is applied here, make sure page.goto is not called anywhere in the project.
            // ONPROJECTFINISH: Add networkidle0, networkidle2 and other multiple modes

            await page.goto(URL, { timeout: 60 * 1000 }); // waitUntil: 'load',
            // await page.goto(URL, { timeout: 10 }); // waitUntil: 'load',
            // await page.goto(URL, { waitUntil: "networkidle2" });
            const pageContent = await page.content();
            if (pageContent.includes('/Framework/Resources/Images/Layout/Errors/500_error.png')) {
                lgi(` ${logSymbols.warning}`, LineSeparator.false);
                if (gotoCnt < 4) {
                    // Sleep for 5 mins
                    for (let cnt = 0; cnt < 100; cnt++) {
                        lgi('.', Color.yellow, LineSeparator.false);
                        await waitForSeconds(3);
                    }
                } else {
                    lge('');
                    lge(`Unable to open the url after 4 retries in interval of 5 mins each (20 mins), found error 500.`);
                    process.exit(0);
                }
            } else {
                break;
            }
        } catch (err) {
            if (
                err.message.match(/Navigation timeout of \d* ms exceeded/g) ||
                err.message.match(/net::ERR_CONNECTION_TIMED_OUT at .*/g) ||
                err.message === 'socket hang up' ||
                err.message === 'aborted' ||
                err.message === 'read ECONNRESET' ||
                err.message === 'Page.navigate timed out.'
            ) {
                lgc(`SUCCESSFULLY ERROR HANDLED (WITHOUT HASH):#${err.message}#`, Color.white);
                lgc(` ${logSymbols.warning}`, LineSeparator.false);
                if (gotoCnt < 4) {
                    // Sleep for 30 seconds
                    for (let cnt = 0; cnt < 10; cnt++) {
                        lgc('.', Color.yellow, LineSeparator.false);
                        await waitForSeconds(3);
                    }
                    incRetryCount();
                } else {
                    lgc('');
                    lgc(
                        `Unable to get the following URL after 5 retries in interval of 30 seconds each, get operation timeout set to 60 seconds: ${URL} .`
                    );
                    lgc('  ', LineSeparator.false);
                }
            } else {
                lgc(`CATCH THIS ERROR (WITHOUT HASH):#${err.message}#`, err);
                throw err;
            }
        }
    }
    debug ? lgd(`Navigating to the URL: ${URL}: Done.`) : null;
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
