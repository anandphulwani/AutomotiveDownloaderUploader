/* eslint-disable import/extensions */
import { lgd } from './loggerandlocksupportive.js';
import { waitForMilliSeconds } from './sleep.js';
/* eslint-enable import/extensions */

async function waitForElementContainsOrEqualsText(page, selector, elementText, timeoutSeconds = 30, exactMatch = false, debug = false) {
    debug ? lgd(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? lgd(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? lgd(`Waiting for ${elementText} (${selector}) text to show up: Executing.`) : '';
    if (exactMatch) {
        // eslint-disable-next-line no-undef
        // await page.waitForFunction((args) => document.querySelector(args[0]).innerText === args[1], { timeout: 90000 }, [selector, elementText]);
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
        // eslint-disable-next-line no-undef
        // await page.waitForFunction((args) => document.querySelector(args[0]).innerText.includes(args[1]), { timeout: 90000 }, [
        //     selector,
        //     elementText,
        // ]);
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
    debug ? lgd(`Waiting for ${elementText} (${selector}) text to show up: Found.`) : '';
}

async function waitForElementContainsOrEqualsHTML(page, selector, elementHTML, timeoutSeconds = 30, exactMatch = false, debug = false) {
    debug ? lgd(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? lgd(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? lgd(`Waiting for ${elementHTML} (${selector}) HTML to show up: Executing.`) : '';
    if (exactMatch) {
        // eslint-disable-next-line no-undef
        // await page.waitForFunction((args) => document.querySelector(args[0]).innerHTML === args[1], { timeout: 90000 }, [selector, elementHTML]);
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
        // eslint-disable-next-line no-undef
        // await page.waitForFunction((args) => document.querySelector(args[0]).innerHTML.includes(args[1]), { timeout: 90000 }, [
        //     selector,
        //     elementHTML,
        // ]);
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
    debug ? lgd(`Waiting for ${elementHTML} (${selector}) text to show up: Found.`) : '';
}

async function waitTillCurrentURLStartsWith(page, partialURL, debug = false) {
    debug ? lgd(`Waiting for the current URL to start with: ${partialURL}: Executing.`) : '';
    // await page.waitForFunction(`window.location.href.startsWith('${partialURL}')`, { timeout: 90000 });
    const timeout = 90000;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (page.url().startsWith(partialURL)) {
            break;
        }
        await waitForMilliSeconds(50);
    }
    if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for URL to start with "${partialURL}"`);
    }
    debug ? lgd(`Waiting for the current URL to start with: ${partialURL}: Matched.`) : '';
}

async function waitTillCurrentURLEndsWith(page, partialURL, debug = false) {
    debug ? lgd(`Waiting for the current URL to ends with: ${partialURL}: Executing.`) : '';
    // await page.waitForFunction(`window.location.href.endsWith('${partialURL}')`, { timeout: 90000 });
    const timeout = 10000;
    const startTime = Date.now();
    while (Date.now() - startTime < timeout) {
        if (page.url().endsWith(partialURL)) {
            break;
        }
        await waitForMilliSeconds(50);
    }
    if (Date.now() - startTime > timeout) {
        throw new Error(`Timeout waiting for URL to ends with "${partialURL}"`);
    }
    debug ? lgd(`Waiting for the current URL to ends with: ${partialURL}: Matched.`) : '';
}

export { waitForElementContainsOrEqualsText, waitForElementContainsOrEqualsHTML, waitTillCurrentURLStartsWith, waitTillCurrentURLEndsWith };
