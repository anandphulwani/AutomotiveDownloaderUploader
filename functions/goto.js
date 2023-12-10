import chalk from 'chalk';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { waitForSeconds } from './sleep.js';
import { incRetryCount } from './others.js';
import { waitTillCurrentURLStartsWith, waitTillCurrentURLEndsWith } from './waiting.js';
import { lgbf, lgc, lgcf, lgd, lge, lgi, lgu } from './loggerandlocksupportive.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import { config } from '../configs/config.js';
/* eslint-enable import/extensions */

async function handleErrorWhileURLNavigation(err, URLToCrawlOrFilename, gotoCnt, timeout) {
    if (
        config.urlCrawlingErrorsEligibleForRetrying.some((patternOrValue) =>
            typeof patternOrValue === 'string' ? err.message === patternOrValue : patternOrValue.test(err.message)
        )
    ) {
        lgcf(`SUCCESSFULLY ERROR HANDLED (WITHOUT HASH):#${err.message}#`);
        lgc(` ${logSymbols.warning}`, Color.yellow, LoggingPrefix.false, LineSeparator.false);
        if (gotoCnt < 4) {
            // Sleep for 30 seconds
            for (let cnt = 0; cnt < 10; cnt++) {
                lgc('.', Color.yellow, LoggingPrefix.false, LineSeparator.false);
                await waitForSeconds(3);
            }
            incRetryCount();
        } else {
            console.log('');
            lgc(
                `Unable to get/download the following URL/file after 5 retries in interval of 30 seconds each, get/download operation timeout set to ${timeout} seconds: ${URLToCrawlOrFilename} .`
            );
        }
    } else {
        lgc(`CATCH THIS ERROR (WITHOUT HASH):#${err.message}#`, err);
        throw err;
    }
}

async function gotoURL(page, URLToCrawl, debug = false) {
    debug ? lgd(`Navigating to the URL: ${URLToCrawl}: Executing.`) : null;
    for (let gotoCnt = 0; gotoCnt < 5; gotoCnt++) {
        try {
            // ONPROJECTFINISH: Error 500 is applied here, make sure page.goto is not called anywhere in the project.
            // ONPROJECTFINISH: Add networkidle0, networkidle2 and other multiple modes

            await page.goto(URLToCrawl, { timeout: 60 * 1000 }); // waitUntil: 'load',
            // await page.goto(URLToCrawl, { timeout: 10 }); // waitUntil: 'load',
            // await page.goto(URLToCrawl, { waitUntil: "networkidle2" });
            const pageContent = await page.content();
            if (pageContent.includes('/Framework/Resources/Images/Layout/Errors/500_error.png')) {
                lgc(` ${logSymbols.warning}`, Color.yellow, LoggingPrefix.false, LineSeparator.false);
                if (gotoCnt < 4) {
                    // Sleep for 5 mins
                    for (let cnt = 0; cnt < 100; cnt++) {
                        lgc('.', Color.yellow, LoggingPrefix.false, LineSeparator.false);
                        await waitForSeconds(3);
                    }
                } else {
                    console.log('');
                    lge(`Unable to open the url after 4 retries in interval of 5 mins each (20 mins), found error 500.`);
                    process.exit(0);
                }
            } else {
                break;
            }
        } catch (err) {
            await handleErrorWhileURLNavigation(err, URLToCrawl, gotoCnt, 60);
        }
    }
    debug ? lgd(`Navigating to the URL: ${URLToCrawl}: Done.`) : null;
    return page.url();
}

async function gotoPageAndWaitTillCurrentURLStartsWith(page, URLToCrawl, partialURL = URLToCrawl, debug = false) {
    await gotoURL(page, URLToCrawl, debug);
    await waitTillCurrentURLStartsWith(page, partialURL, debug);
}

async function gotoPageAndWaitTillCurrentURLEndsWith(page, URLToCrawl, partialURL = URLToCrawl, debug = false) {
    await gotoURL(page, URLToCrawl, debug);
    await waitTillCurrentURLEndsWith(page, partialURL, debug);
}

export { handleErrorWhileURLNavigation, gotoURL, gotoPageAndWaitTillCurrentURLStartsWith, gotoPageAndWaitTillCurrentURLEndsWith };
