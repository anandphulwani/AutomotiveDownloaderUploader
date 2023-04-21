async function fillInTextbox(page, selector, textToFill, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? console.log(`Filling the ${selector} with empty value: Executing.`) : '';
    // await page.evaluate( () => document.querySelector(selector).value = "")
    // await page.type(selector, "");
    await page.focus(selector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    debug ? console.log(`Filling the ${selector} with empty value: Done.`) : '';
    debug ? console.log(`Checking if ${selector} is empty: Executing.`) : '';
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
    debug ? console.log(`Checking if ${selector} is empty: Done.`) : '';

    debug ? console.log('Waiting for 10 seconds.') : '';
    // eslint-disable-next-line no-promise-executor-return
    debug ? await new Promise((r) => setTimeout(r, 10000)) : '';
    debug ? console.log('Waiting for 10 seconds done.') : '';

    debug ? console.log(`Filling the ${selector} now: Executing.`) : '';
    await page.type(selector, textToFill);
    debug ? console.log(`Filling the ${selector} now: Done.`) : '';
    debug ? console.log(`Checking if ${selector} value matches filled: Executing.`) : '';
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
    debug ? console.log(`Checking if ${selector} value matches filled: Done.`) : '';
}

async function clickOnButton(page, selector, buttonText = false, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    if (buttonText !== false) {
        debug ? console.log(`Check if the ${selector} contains text: ${buttonText}: Executing.`) : '';
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
        debug ? console.log(`Check if the ${selector} contains text: ${buttonText}: Found.`) : '';
    }

    debug ? console.log(`Clicking the ${selector} button: Executing.`) : '';
    // await page.click(selector);
    await page.evaluate((selectorString) => {
        // eslint-disable-next-line no-undef
        const element = document.querySelector(selectorString);
        if (element) {
            element.click();
        }
    }, selector);
    debug ? console.log(`Clicking the ${selector} button: Done.`) : '';
}

async function enableAndClickOnButton(page, selector, buttonText = false, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    await page.evaluate((selectorToEnable) => {
        // eslint-disable-next-line no-undef
        const element = document.querySelector(selectorToEnable);
        element.style.display = 'block';
    }, selector);
    clickOnButton(page, selector, buttonText, debug);
}

export { fillInTextbox, clickOnButton, enableAndClickOnButton };
