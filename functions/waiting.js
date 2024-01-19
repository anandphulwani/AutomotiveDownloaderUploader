/* eslint-disable import/extensions */
import { lgd, lgu } from './loggerandlocksupportive.js';
import { waitForMilliSeconds } from './sleep.js';
/* eslint-enable import/extensions */

async function waitForElementContainsOrEqualsText(page, selector, elementText, timeoutSeconds = 30, exactMatch = false, debug = false) {
    debug ? lgd(`Waiting for the ${selector} to load: Executing.`) : null;
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? lgd(`Waiting for the ${selector} to load: Found.`) : null;

    debug ? lgd(`Waiting for ${elementText} (${selector}) text to show up: Executing.`) : null;
    if (exactMatch) {
        await page.evaluate(
            (selectorInner, elementTextInner, timeoutSecondsInner) =>
                new Promise((resolve, reject) => {
                    const intervalId = setInterval(() => {
                        // eslint-disable-next-line no-undef
                        const element = document.querySelector(selectorInner);
                        if (element && element.innerText === elementTextInner) {
                            clearInterval(intervalId);
                            resolve();
                        }
                    }, 1000);
                    setTimeout(() => {
                        clearInterval(intervalId);
                        reject(new Error(`Timeout waiting for element with selector "${selectorInner}" to have exact text "${elementTextInner}"`));
                    }, timeoutSecondsInner * 1000);
                }),
            selector,
            elementText,
            timeoutSeconds
        );
    } else {
        await page.evaluate(
            (selectorInner, elementTextInner, timeoutSecondsInner) =>
                new Promise((resolve, reject) => {
                    const intervalId = setInterval(() => {
                        // eslint-disable-next-line no-undef
                        const element = document.querySelector(selectorInner);
                        if (element && element.innerText.includes(elementTextInner)) {
                            clearInterval(intervalId);
                            resolve();
                        }
                    }, 1000);
                    setTimeout(() => {
                        clearInterval(intervalId);
                        reject(
                            new Error(`Timeout waiting for element with selector "${selectorInner}" to include(non exact) text "${elementTextInner}"`)
                        );
                    }, timeoutSecondsInner * 1000);
                }),
            selector,
            elementText,
            timeoutSeconds
        );
    }
    debug ? lgd(`Waiting for ${elementText} (${selector}) text to show up: Found.`) : null;
}

async function waitForElementContainsOrEqualsHTML(page, selector, elementHTML, timeoutSeconds = 30, exactMatch = false, debug = false) {
    debug ? lgd(`Waiting for the ${selector} to load: Executing.`) : null;
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? lgd(`Waiting for the ${selector} to load: Found.`) : null;

    debug ? lgd(`Waiting for ${elementHTML} (${selector}) HTML to show up: Executing.`) : null;
    if (exactMatch) {
        await page.evaluate(
            (selectorInner, elementHTMLInner, timeoutSecondsInner) =>
                new Promise((resolve, reject) => {
                    const intervalId = setInterval(() => {
                        // eslint-disable-next-line no-undef
                        const element = document.querySelector(selectorInner);
                        if (element && element.innerHTML === elementHTMLInner) {
                            clearInterval(intervalId);
                            resolve();
                        }
                    }, 1000);
                    setTimeout(() => {
                        clearInterval(intervalId);
                        reject(new Error(`Timeout waiting for element with selector "${selectorInner}" to have exact HTML "${elementHTMLInner}"`));
                    }, timeoutSecondsInner * 1000);
                }),
            selector,
            elementHTML,
            timeoutSeconds
        );
    } else {
        await page.evaluate(
            (selectorInner, elementHTMLInner, timeoutSecondsInner) =>
                new Promise((resolve, reject) => {
                    const intervalId = setInterval(() => {
                        // eslint-disable-next-line no-undef
                        const element = document.querySelector(selectorInner);
                        if (element && element.innerHTML.includes(elementHTMLInner)) {
                            clearInterval(intervalId);
                            resolve();
                        }
                    }, 1000);
                    setTimeout(() => {
                        clearInterval(intervalId);
                        reject(
                            new Error(`Timeout waiting for element with selector "${selectorInner}" to include(non exact) HTML "${elementHTMLInner}"`)
                        );
                    }, timeoutSecondsInner * 1000);
                }),
            selector,
            elementHTML,
            timeoutSeconds
        );
    }
    debug ? lgd(`Waiting for ${elementHTML} (${selector}) text to show up: Found.`) : null;
}

async function waitTillCurrentURLStartsWith(page, partialURL, debug = false) {
    debug ? lgd(`Waiting for the current URL to start with: ${partialURL}: Executing.`) : null;
    const timeout = 90000;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (page.url().startsWith(partialURL)) {
            break;
        }
        await waitForMilliSeconds(50);
    }
    if (Date.now() - startTime > timeout) {
        lgu(`Timeout waiting for URL to start with "${partialURL}"`);
        process.exit(1);
    }
    debug ? lgd(`Waiting for the current URL to start with: ${partialURL}: Matched.`) : null;
}

async function waitTillCurrentURLEndsWith(page, partialURL, debug = false) {
    debug ? lgd(`Waiting for the current URL to ends with: ${partialURL}: Executing.`) : null;
    const timeout = 10000;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (page.url().endsWith(partialURL)) {
            break;
        }
        await waitForMilliSeconds(50);
    }
    if (Date.now() - startTime > timeout) {
        lgu(`Timeout waiting for URL to ends with "${partialURL}"`);
        process.exit(1);
    }
    debug ? lgd(`Waiting for the current URL to ends with: ${partialURL}: Matched.`) : null;
}

export { waitForElementContainsOrEqualsText, waitForElementContainsOrEqualsHTML, waitTillCurrentURLStartsWith, waitTillCurrentURLEndsWith };
