async function waitForElementContainsText(page, selector, elementText, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector);
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? console.log(`Waiting for ${elementText} (${selector}) text to show up: Executing.`) : '';
    // eslint-disable-next-line no-undef
    await page.waitForFunction((args) => document.querySelector(args[0]).innerText.includes(args[1]), {}, [selector, elementText]);
    debug ? console.log(`Waiting for ${elementText} (${selector}) text to show up: Found.`) : '';
}

async function waitForElementContainsHTML(page, selector, elementHTML, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector);
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? console.log(`Waiting for ${elementHTML} (${selector}) text to show up: Executing.`) : '';
    // eslint-disable-next-line no-undef
    await page.waitForFunction((args) => document.querySelector(args[0]).innerHTML.includes(args[1]), {}, [selector, elementHTML]);
    debug ? console.log(`Waiting for ${elementHTML} (${selector}) text to show up: Found.`) : '';
}

async function waitTillCurrentURLStartsWith(page, partialURL, debug = false) {
    debug ? console.log(`Waiting for the current URL to match to: ${partialURL}: Executing.`) : '';
    await page.waitForFunction(`window.location.href.startsWith('${partialURL}')`);
    debug ? console.log(`Waiting for the current URL to match to: ${partialURL}: Matched.`) : '';
}

export { waitForElementContainsText, waitForElementContainsHTML, waitTillCurrentURLStartsWith };
