// eslint-disable-next-line import/extensions
import { waitForElementContainsText, waitForElementContainsHTML, waitTillCurrentURLStartsWith } from './waiting.js';

async function gotoURL(page, URL, debug = false) {
    debug ? console.log(`Navigating to the URL: ${URL}: Executing.`) : '';
    await page.goto(URL, { timeout: 180 * 1000 }); // waitUntil: 'load',
    // await page.goto(URL, { waitUntil: "networkidle2" }); //TODO: Add networkidle0, networkidle2 and other multiple modes
    debug ? console.log(`Navigating to the URL: ${URL}: Done.`) : '';
}

async function gotoPageAndWaitTillCurrentURLStartsWith(page, URL, partialURL = URL, debug = false) {
    await gotoURL(page, URL, debug);
    await waitTillCurrentURLStartsWith(page, partialURL, debug);
}

export { gotoURL, gotoPageAndWaitTillCurrentURLStartsWith };
