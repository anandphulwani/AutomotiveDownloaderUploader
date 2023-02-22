import puppeteer from "puppeteer";

(async () => {

    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
        args: [
            '--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data'
        ],
    });

    const [page] = await browser.pages();   
    
    await gotoPageAndCheckIfCurrentURLStartsWith(page, "https://signin.coxautoinc.com/logout?bridge_solution=HME", "https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId=", true)
    //await gotoPageAndCheckIfCurrentURLStartsWith(page, "https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId=efb6cb5b4f2a401a8225c9f2e8c6313c", undefined, true)
    await fillInTextbox (page, "#username", "dinesharora80@gmail.com");
    await clickOnButton (page, "#signIn", "Next");
    await waitForElementContainsText(page, "#returnLink", "← dinesharora80@gmail.com")
    await fillInTextbox (page, "#password", "kunsh123");
    await clickOnButton (page, "#signIn", "Sign in");
    await checkIfCurrentURLStartsWith(page, "https://www.homenetiol.com/dashboard")
    await waitForElementContainsHTML(page, "dt.bb-userdatum__value", "dinesharora80@gmail.com", true)
    await waitForSeconds(10, true);
    await browser.close();
    process.exit(0);
})();

async function fillInTextbox (page, selector, textToFill, debug = false) {
    debug ? console.log("Waiting for the "+selector+" to load: Executing.") : "";
    await page.waitForSelector(selector);
    debug ? console.log("Waiting for the "+selector+" to load: Found.") : "";

    debug ? console.log("Filling the "+selector+" with empty value: Executing.") : "";
    //await page.evaluate( () => document.querySelector(selector).value = "")
    //await page.type(selector, "");
    await page.focus(selector);
    await page.keyboard.down('Control');await page.keyboard.press('A');await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    debug ? console.log("Filling the "+selector+" with empty value: Done.") : "";
   
    debug ? console.log("Checking if "+selector+" is empty: Executing.") : "";
    await page.waitForFunction( selector => document.querySelector(selector).value == "", {}, selector)
    debug ? console.log("Checking if "+selector+" is empty: Done.") : "";

    debug ? console.log("Waiting for 10 seconds.") : "";
    debug ? await new Promise(r => setTimeout(r, 10000)) : "";
    debug ? console.log("Waiting for 10 seconds done.") : "";

    debug ? console.log("Filling the "+selector+" now: Executing.") : "";
    await page.type(selector, textToFill);
    debug ? console.log("Filling the "+selector+" now: Done.") : "";
    debug ? console.log("Checking if "+selector+" value matches filled: Executing.") : "";
    await page.waitForFunction(
        (args) => document.querySelector(args[0]).value == args[1], 
        {}, [selector, textToFill]);
    debug ? console.log("Checking if "+selector+" value matches filled: Done.") : "";
}

async function clickOnButton (page, selector, buttonText, debug = false) {
    debug ? console.log("Waiting for the "+selector+" to load: Executing.") : "";
    await page.waitForSelector(selector);
    debug ? console.log("Waiting for the "+selector+" to load: Found.") : "";

    debug ? console.log("Check if the "+selector+" contains text: "+buttonText+": Executing.") : "";
    await page.waitForFunction(
        (args) => document.querySelector(args[0]).innerText.includes(args[1]),
        {},[selector, buttonText]);
    debug ? console.log("Check if the "+selector+" contains text: "+buttonText+": Found.") : "";

    debug ? console.log("Clicking the "+selector+" button: Executing.") : "";
    await page.click(selector);
    debug ? console.log("Clicking the "+selector+" button: Done.") : "";
}

async function waitForElementContainsText(page, selector, elementText, debug = false) {
    debug ? console.log("Waiting for the "+selector+" to load: Executing.") : "";
    await page.waitForSelector(selector);
    debug ? console.log("Waiting for the "+selector+" to load: Found.") : "";

    debug ? console.log("Waiting for "+elementText+" ("+selector+") text to show up: Executing.") : "";
    await page.waitForFunction(
        (args) => document.querySelector(args[0]).innerText.includes(args[1]),
        {},[selector, elementText]);
    debug ? console.log("Waiting for "+elementText+" ("+selector+") text to show up: Found.") : "";
}

async function waitForElementContainsHTML(page, selector, elementHTML, debug = false) {
    debug ? console.log("Waiting for the "+selector+" to load: Executing.") : "";
    await page.waitForSelector(selector);
    debug ? console.log("Waiting for the "+selector+" to load: Found.") : "";

    debug ? console.log("Waiting for "+elementHTML+" ("+selector+") text to show up: Executing.") : "";
    await page.waitForFunction(
        (args) => document.querySelector(args[0]).innerHTML.includes(args[1]),
        {},[selector, elementHTML]);
    debug ? console.log("Waiting for "+elementHTML+" ("+selector+") text to show up: Found.") : "";
}

async function checkIfCurrentURLStartsWith(page, partialURL, debug = false) {
    debug ? console.log("Waiting for the current URL to match to: "+partialURL+": Executing.") : "";
    await page.waitForFunction("window.location.href.startsWith('"+partialURL+"')");
    debug ? console.log("Waiting for the current URL to match to: "+partialURL+": Matched.") : "";
}

async function gotoPageAndCheckIfCurrentURLStartsWith(page, URL, partialURL = URL , debug = false) {
    debug ? console.log("Navigating to the URL: "+URL+": Executing.") : "";
    await page.goto(URL);
    debug ? console.log("Navigating to the URL: "+URL+": Done.") : "";
    await checkIfCurrentURLStartsWith(page, partialURL, debug);
}

async function waitForSeconds(seconds, debug = false) {
    console.log("Waiting start for "+seconds+" seconds: Executing.");
    await new Promise(r => setTimeout(r, ( seconds * 1000 )));
    console.log("Waiting start for "+seconds+" seconds: Done.");
}