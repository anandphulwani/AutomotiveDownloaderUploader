/* eslint-disable import/extensions */
import { lgd, lgs } from './loggerandlocksupportive.js';
/* eslint-enable import/extensions */

async function fillInTextbox(page, selector, textToFill, debug = false) {
    debug ? lgd(`Waiting for the ${selector} to load: Executing.`) : null;
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? lgd(`Waiting for the ${selector} to load: Found.`) : null;

    debug ? lgd(`Filling the ${selector} with empty value: Executing.`) : null;
    // await page.evaluate( () => document.querySelector(selector).value = "")
    // await page.type(selector, "");
    await page.focus(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    debug ? lgd(`Filling the ${selector} with empty value: Done.`) : null;
    debug ? lgd(`Checking if ${selector} is empty: Executing.`) : null;
    // eslint-disable-next-line no-undef, no-shadow
    // await page.waitForFunction((selector) => document.querySelector(selector).value === '', { timeout: 90000 }, selector);
    await page.evaluate(
        (selectorInner) =>
            new Promise((resolve, reject) => {
                const intervalId = setInterval(() => {
                    // eslint-disable-next-line no-undef
                    const element = document.querySelector(selectorInner);
                    if (element && element.value === '') {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 1000);
                setTimeout(() => {
                    clearInterval(intervalId);
                    reject(new Error(`Timeout waiting for element with selector "${selectorInner}" to have blank value."`));
                }, 90000);
            }),
        selector
    );
    debug ? lgd(`Checking if ${selector} is empty: Done.`) : null;

    debug ? lgd('Waiting for 10 seconds.') : null;
    // eslint-disable-next-line no-promise-executor-return
    debug ? await new Promise((r) => setTimeout(r, 10000)) : '';
    debug ? lgd('Waiting for 10 seconds done.') : null;

    debug ? lgd(`Filling the ${selector} now: Executing.`) : null;
    await page.type(selector, textToFill);
    debug ? lgd(`Filling the ${selector} now: Done.`) : null;
    debug ? lgd(`Checking if ${selector} value matches filled: Executing.`) : null;
    // eslint-disable-next-line no-undef
    // await page.waitForFunction((args) => document.querySelector(args[0]).value === args[1], { timeout: 90000 }, [selector, textToFill]);
    await page.evaluate(
        (selectorInner, textToFillInner) =>
            new Promise((resolve, reject) => {
                const intervalId = setInterval(() => {
                    // eslint-disable-next-line no-undef
                    const element = document.querySelector(selectorInner);
                    if (element && element.value === textToFillInner) {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 1000);
                setTimeout(() => {
                    clearInterval(intervalId);
                    reject(new Error(`Timeout waiting for element with selector "${selectorInner}" to have value "${textToFillInner}"`));
                }, 90000);
            }),
        selector,
        textToFill
    );
    debug ? lgd(`Checking if ${selector} value matches filled: Done.`) : null;
}

async function clickOnButton(page, selector, buttonText = false, isMouseClick = false, debug = false) {
    debug ? lgd(`Waiting for the ${selector} to load: Executing.`) : null;
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? lgd(`Waiting for the ${selector} to load: Found.`) : null;

    if (buttonText !== false) {
        debug ? lgd(`Check if the ${selector} contains text: ${buttonText}: Executing.`) : null;
        // eslint-disable-next-line no-undef
        // await page.waitForFunction((args) => document.querySelector(args[0]).innerText.includes(args[1]), { timeout: 90000 }, [selector, buttonText]);
        await page.evaluate(
            (selectorInner, buttonTextInner) =>
                new Promise((resolve, reject) => {
                    const intervalId = setInterval(() => {
                        // eslint-disable-next-line no-undef
                        const element = document.querySelector(selectorInner);
                        if (element && element.innerText.includes(buttonTextInner)) {
                            clearInterval(intervalId);
                            resolve();
                        }
                    }, 1000);
                    setTimeout(() => {
                        clearInterval(intervalId);
                        reject(
                            new Error(`Timeout waiting for element with selector "${selectorInner}" to include(non exact) text "${buttonTextInner}"`)
                        );
                    }, 30000);
                }),
            selector,
            buttonText
        );
        debug ? lgd(`Check if the ${selector} contains text: ${buttonText}: Found.`) : null;
    }

    debug ? lgd(`Clicking the ${selector} button: Executing.`) : null;
    // await page.click(selector);
    const elementToClick = await page.$(selector);
    if (elementToClick) {
        if (!isMouseClick) {
            await page.evaluate((element) => {
                if (element) {
                    element.click();
                }
            }, elementToClick);
        } else {
            // lgtf(`Moving to the fromPositionElement: ${fromPositionElement}`);
            await page.evaluate((element) => element.scrollIntoView(), elementToClick);
            // lgtf(`Confirming the fromPositionElement is in the browser viewport.`);
            await page.waitForFunction(
                (element) => {
                    const { top, bottom } = element.getBoundingClientRect();
                    // eslint-disable-next-line no-undef
                    const viewportHeight = window.innerHeight;
                    return top >= 0 && bottom <= viewportHeight;
                },
                {},
                elementToClick
            );
            const elementRect = await page.evaluate((el) => {
                const { x, y, width, height } = el.getBoundingClientRect();
                return { x, y, width, height };
            }, elementToClick);
            await page.mouse.move(elementRect.x + elementRect.width / 2, elementRect.y + elementRect.height / 2, { steps: 1 });
            await page.mouse.click(elementRect.x + elementRect.width / 2, elementRect.y + elementRect.height / 2);
        }
    } else {
        lgs(`Element to click '${selector}' does not exist`);
        process.exit(1);
    }
    debug ? lgd(`Clicking the ${selector} button: Done.`) : null;
}

async function enableAndClickOnButton(page, selector, buttonText = false, debug = false) {
    debug ? lgd(`Waiting for the ${selector} to load: Executing.`) : null;
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? lgd(`Waiting for the ${selector} to load: Found.`) : null;

    await page.evaluate((selectorToEnable) => {
        // eslint-disable-next-line no-undef
        const element = document.querySelector(selectorToEnable);
        element.style.display = 'block';
    }, selector);
    await clickOnButton(page, selector, buttonText, debug);
}

export { fillInTextbox, clickOnButton, enableAndClickOnButton };
