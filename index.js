import chalk from 'chalk';
import { NtpTimeSync } from "ntp-time-sync";
import { getChromeBookmark } from "chrome-bookmark-reader";
import puppeteer from "puppeteer";
import https from "https";
import fs from "fs";

// const http = require('http'); // or 'https' for https:// URLs
// const fs = require('fs');


if (false) {
/**
 * Check if timezone matches of Asia/Calcutta
 */
console.log(chalk.cyan("Check if timezone matches of Asia/Calcutta: Executing."));
if (Intl.DateTimeFormat().resolvedOptions().timeZone != "Asia/Calcutta") {
    console.log(chalk.white.bgRed.bold("System timezone is not set to India: Asia/Calcutta UTC+5.30 Hours"));
    process.exit(1);
} else {
    console.log(chalk.green.bold("System timezone matches to India: Asia/Calcutta UTC+5.30 Hours"));
}
console.log(chalk.cyan("Check if timezone matches of Asia/Calcutta: Done."));
printSectionSeperator();


/**
 * Check if time is in sync with online NTP servers.
 */
console.log(chalk.cyan("Check if time is in sync with online NTP servers.: Executing."));
const timeSync = NtpTimeSync.getInstance();
await timeSync.getTime().then(function (result) {
  console.log(chalk.cyan("Current System time: "+ new Date() +",\nReal time (NTP Servers): "+result.now));
  const offsetInSeconds = Math.abs( Math.round( result.offset / 1000 ) );
  if ( offsetInSeconds > (2 * 60 ) ) {
    console.log(chalk.white.bgRed.bold("System time not set accurately, time is off by "+ offsetInSeconds +" seconds ("+result.offset+"ms), \nPlease re sync time with NTP server."));
    process.exit(1);
  } else {
    console.log(chalk.green.bold("System time shows accurate data i.e. (within 2 mins differnce), current offset is "+ offsetInSeconds +" seconds ("+result.offset+"ms)."));
  }
})
console.log(chalk.cyan("Check if time is in sync with online NTP servers.: Done."));
printSectionSeperator();
}

/**
 * Read chrome bookmarks from chrome browser
 */
// const path = '/path/to/Chrome/Bookmark' OR '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\Bookmarks' //TODO: Change path to default and pick from ini
const path = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks'
const option = {
    shouldIncludeFolders: true,
  }
const bookmarks = getChromeBookmark(path, option);

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

    for(const topLevelBookmark of bookmarks) {
        if ( topLevelBookmark.name == "Bookmarks bar" ) {
            console.log(chalk.cyan("Reading Bookmarks bar from the bookmarks data."));
            var usernameLevelBookmarks = topLevelBookmark.children
            for(const usernameLevelBookmark of usernameLevelBookmarks) {
                console.log(chalk.cyan("Reading Bookmarks for the Username: "+chalk.cyan.bold(usernameLevelBookmark.name)));
                /** */
                await gotoPageAndWaitTillCurrentURLStartsWith(page, "https://signin.coxautoinc.com/logout?bridge_solution=HME", "https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId=") // use  (..., undefined, true) as params
                await fillInTextbox (page, "#username", "dinesharora80@gmail.com");
                await clickOnButton (page, "#signIn", "Next");
                await waitForElementContainsText(page, "#returnLink", "← dinesharora80@gmail.com")
                await fillInTextbox (page, "#password", "kunsh123");
                await clickOnButton (page, "#signIn", "Sign in");
                await waitTillCurrentURLStartsWith(page, "https://www.homenetiol.com/dashboard")
                await waitForElementContainsHTML(page, "dt.bb-userdatum__value", "dinesharora80@gmail.com")
                await waitForSeconds(10);
                

                var dealerLevelBookmarks = usernameLevelBookmark.children
                for(const dealerLevelBookmark of dealerLevelBookmarks) {
                    console.log(chalk.cyan("Reading Bookmarks for the Dealer: "+chalk.cyan.bold(dealerLevelBookmark.name)+" from the Username: "+chalk.cyan.bold(usernameLevelBookmark.name)));
                    var vehicleBookmarks = dealerLevelBookmark.children
                    for(const vehicleBookmark of vehicleBookmarks) {
                        await handleBookmarkURL(page, vehicleBookmark.name, vehicleBookmark.url)
                        await waitForSeconds(0);
                    }
                }  
            }
        }
    }
    await browser.close();
})(); 
//await sleep(10000); 
//process.exit(0);














function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function sleep(n) {
    msleep(n*1000);
}

function printSectionSeperator() {
    console.log(chalk.black.bgWhiteBright("-".repeat(80)));
}

async function getCursorPosOnTerminal() {
    return new Promise((resolve) => {
        const termcodes = { cursorGetPosition: '\u001b[6n' };
        process.stdin.setEncoding('utf8');
        process.stdin.setRawMode(true);
        const readfx = function () {
            const buf = process.stdin.read();
            const str = JSON.stringify(buf); // "\u001b[9;1R"
            const regex = /\[(.*)/g;
            const xy = regex.exec(str)[0].replace(/\[|R"/g, '').split(';');
            const pos = { rows: xy[0], cols: xy[1] };
            process.stdin.setRawMode(false);
            resolve(pos);
        }
        process.stdin.once('readable', readfx);
        process.stdout.write(termcodes.cursorGetPosition);
    });
}

async function getRowPosOnTerminal() {
    const pos = await getCursorPosOnTerminal();
    return pos.rows;
}

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

async function waitTillCurrentURLStartsWith(page, partialURL, debug = false) {
    debug ? console.log("Waiting for the current URL to match to: "+partialURL+": Executing.") : "";
    await page.waitForFunction("window.location.href.startsWith('"+partialURL+"')");
    debug ? console.log("Waiting for the current URL to match to: "+partialURL+": Matched.") : "";
}

async function gotoURL(page, URL, debug = false) {
    debug ? console.log("Navigating to the URL: "+URL+": Executing.") : "";
    await page.goto(URL, { timeout: ( 180 * 1000 ) }); //waitUntil: 'load', 
    // await page.goto(URL, { waitUntil: "networkidle2" }); //TODO: Add networkidle0, networkidle2 and other multiple modes
    debug ? console.log("Navigating to the URL: "+URL+": Done.") : "";
}

async function gotoPageAndWaitTillCurrentURLStartsWith(page, URL, partialURL = URL , debug = false) {
    await gotoURL(page, URL, debug);
    await waitTillCurrentURLStartsWith(page, partialURL, debug);
}

async function waitForSeconds(seconds, debug = false) {
    debug ? process.stdout.write("Waiting start for "+seconds+" seconds: Executing.  ") : "";
    // console.log("Waiting start for "+seconds+" seconds: Executing.");
    // process.stdout.write(`${index},`);
    for (let cnt = 0; cnt < seconds; cnt++) {
        debug ? process.stdout.write('.') : "";
        await new Promise(r => setTimeout(r, ( 1 * 1000 )));
    }
    //await new Promise(r => setTimeout(r, ( seconds * 1000 )));
    debug ? console.log("\nWaiting start for "+seconds+" seconds: Done.") : "";
}

async function handleBookmarkURL(page, name, URL, debug = false) {
    if (URL.startsWith("https://www.homenetiol.com/inventory/photo-manager?")) {
        console.log(chalk.magenta("\t"+name+" : "+URL+" : Gallery URL ...... (Ignoring)"));
    } else {
        const startingRow = await getRowPosOnTerminal();
        process.stdout.write(chalk.cyan("\t"+name+" : "+URL+"\n"));
        const endingRow = await getRowPosOnTerminal();
        const diffInRows = endingRow - startingRow;
        await gotoURL(page, URL, debug);
        if (page.url().startsWith("https://www.homenetiol.com/dashboard?")) {
            debug ? "" : process.stdout.moveCursor(0, -(diffInRows)); // up one line
            debug ? "" : process.stdout.clearLine(diffInRows); // from cursor to end
            debug ? "" : process.stdout.cursorTo(0);
            process.stdout.write(chalk.red.bold("\t"+name+" : "+URL+" : Supplied URL doesn't exist ...... (Ignoring)"+"\n"));
            await waitForSeconds(5);
        } else {
            // document.querySelector
            // const pageContent = await page.content();
            await getImagesFromContent(page);
            await waitForSeconds(10, true);

        }
    }
}

async function getImagesFromContent(page, debug = false) {
    // const inner_html = await page.$eval('.container.tn-list.sortable.deletable.ui-sortable', element => element.innerHTML);
    const image_div_container = await page.$('.tn-list-container');
    const image_ul_container = await image_div_container.$('.container.tn-list.sortable.deletable.ui-sortable');
    const image_largesrc_urls = await image_ul_container.$$eval('img.tn-car', el => el.map(x => x.getAttribute("largesrc")));
    
    //const tweetURLSpanValue = tweetURLElementHandle[0];
    /* for(let image_li of image_ul_container){
        const trText = await page.evaluate(el => el.innerHTML, tr);
        console.log(trText)
    } */
    // const second_value = await page.$$eval('table tr td', el => el[1].innerHTML);
    // console.log(await (await image_ul_container.getProperty('innerHTML')).jsonValue());
    // console.log(tweetURLElementHandle.length);
    //for(let image_largesrc_url of image_largesrc_urls){
    for (let index = 0; index < image_largesrc_urls.length; index++) { 
        // const trText = await page.evaluate(el => el.innerHTML, tr);
        // console.log(trText)
        console.log(image_largesrc_urls[index]);      
        const file = fs.createWriteStream((index+1)+".jpg");
        https.get(image_largesrc_urls[index], function(response) {
            response.pipe(file);
            // after download completed close filestream
            file.on("finish", () => {
                file.close();
                console.log("Download Completed");
                });
        });
    }
}