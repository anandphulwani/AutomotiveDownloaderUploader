async function waitForElementContainsOrEqualsText(page, selector, elementText, exactMatch = false, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? console.log(`Waiting for ${elementText} (${selector}) text to show up: Executing.`) : '';
    if (exactMatch) {
        // eslint-disable-next-line no-undef
        await page.waitForFunction((args) => document.querySelector(args[0]).innerText === args[1], { timeout: 90000 }, [selector, elementText]);
    } else {
        // eslint-disable-next-line no-undef
        await page.waitForFunction((args) => document.querySelector(args[0]).innerText.includes(args[1]), { timeout: 90000 }, [
            selector,
            elementText,
        ]);
    }
    debug ? console.log(`Waiting for ${elementText} (${selector}) text to show up: Found.`) : '';
}

async function waitForElementContainsOrEqualsHTML(page, selector, elementHTML, exactMatch = false, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector, { timeout: 90000 });
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? console.log(`Waiting for ${elementHTML} (${selector}) text to show up: Executing.`) : '';
    if (exactMatch) {
        // eslint-disable-next-line no-undef
        await page.waitForFunction((args) => document.querySelector(args[0]).innerHTML === args[1], { timeout: 90000 }, [selector, elementHTML]);
    } else {
        // eslint-disable-next-line no-undef
        await page.waitForFunction((args) => document.querySelector(args[0]).innerHTML.includes(args[1]), { timeout: 90000 }, [
            selector,
            elementHTML,
        ]);
    }
    debug ? console.log(`Waiting for ${elementHTML} (${selector}) text to show up: Found.`) : '';
}

async function waitTillCurrentURLStartsWith(page, partialURL, debug = false) {
    debug ? console.log(`Waiting for the current URL to start with: ${partialURL}: Executing.`) : '';
    await page.waitForFunction(`window.location.href.startsWith('${partialURL}')`, { timeout: 90000 });
    debug ? console.log(`Waiting for the current URL to start with: ${partialURL}: Matched.`) : '';
}

async function waitTillCurrentURLEndsWith(page, partialURL, debug = false) {
    debug ? console.log(`Waiting for the current URL to ends with: ${partialURL}: Executing.`) : '';
    await page.waitForFunction(`window.location.href.endsWith('${partialURL}')`, { timeout: 90000 });
    debug ? console.log(`Waiting for the current URL to ends with: ${partialURL}: Matched.`) : '';
}

export { waitForElementContainsOrEqualsText, waitForElementContainsOrEqualsHTML, waitTillCurrentURLStartsWith, waitTillCurrentURLEndsWith };
