import os from "os";
import fs from "fs";
import chalk from 'chalk';
import puppeteer from "puppeteer";
import https from "https";
import crypto from "crypto";
import randomstring from 'randomstring';
import path from 'path';
import { NtpTimeSync } from "ntp-time-sync";
import { getChromeBookmark } from "chrome-bookmark-reader";


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
// const bookmarkPath = '/path/to/Chrome/Bookmark' OR '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\Bookmarks' //TODO: Change path to default and pick from ini
const bookmarkPath = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks'
const option = {
    shouldIncludeFolders: true,
  }
const bookmarks = getChromeBookmark(bookmarkPath, option);

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
                /**
                await gotoPageAndWaitTillCurrentURLStartsWith(page, "https://signin.coxautoinc.com/logout?bridge_solution=HME", "https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId=") // use  (..., undefined, true) as params
                await fillInTextbox (page, "#username", "dinesharora80@gmail.com");
                await clickOnButton (page, "#signIn", "Next");
                await waitForElementContainsText(page, "#returnLink", "← dinesharora80@gmail.com")
                await fillInTextbox (page, "#password", "kunsh123");
                await clickOnButton (page, "#signIn", "Sign in");
                await waitTillCurrentURLStartsWith(page, "https://www.homenetiol.com/dashboard")
                await waitForElementContainsHTML(page, "dt.bb-userdatum__value", "dinesharora80@gmail.com")
                await waitForSeconds(10);
                 */

                var dealerLevelBookmarks = usernameLevelBookmark.children
                for(const dealerLevelBookmark of dealerLevelBookmarks) {
                    console.log(chalk.cyan("Reading Bookmarks for the Dealer: "+chalk.cyan.bold(dealerLevelBookmark.name)+" from the Username: "+chalk.cyan.bold(usernameLevelBookmark.name)));
                    var vehicleBookmarks = dealerLevelBookmark.children
                    for(const vehicleBookmark of vehicleBookmarks) {
                        await handleBookmarkURL(page, dealerLevelBookmark.name, vehicleBookmark.name, vehicleBookmark.url)
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

function zeroPad(num, places) {
    var zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join("0") + num;
}

function generateTempFolderWithRandomText(debug = false) {
    const randomFolder = randomstring.generate({ length: 8, charset: 'alphabetic', capitalization : 'lowercase' });
    debug ? console.log("Generated random folder name : "+randomFolder) : "";
    const tempPathWithRandomFolder = os.tmpdir()+"/"+randomFolder;
    debug ? console.log("Temporary path with suffixed random folder : "+tempPathWithRandomFolder) : "";
    return tempPathWithRandomFolder;
}

async function makeDir(dirPath, debug = false) {
    await new Promise((resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (error) => {
            if (error) {
                console.log(chalk.white.bgRed.bold("Unable to create a directory : "+dirPath));
                process.exit(1);
            } else {
                debug ? console.log("Folder path created successfully : "+dirPath) : ""; 
                resolve();
            }
        });
    });
}

async function moveFile(fromPath, toPath, debug = false) {
    if (! fs.existsSync(path.dirname(toPath)) ) {
        console.log("moveFile function : making directory: "+path.dirname(toPath)+" : Executing.");
        await makeDir(path.dirname(toPath)+"/", debug); 
        console.log("moveFile function : making directory: "+path.dirname(toPath)+" : Done.");
    }
    await new Promise((resolve, reject) => {
        fs.rename(fromPath, toPath, function (error) {
            if (error) {
                console.log(chalk.white.bgRed.bold("Unable to move file from the "+
                "\n\tSource Directory: "+fromPath+
                "\n\t\t\tTo "+
                "\n\tDestination Directory: "+toPath));
                process.exit(1);
            } else {
                debug ? console.log("File moved successfully from the  "+
                "\n\tSource Directory: "+fromPath+
                "\n\t\t\tTo "+
                "\n\tDestination Directory: "+toPath) : ""; 
                resolve();
            }
        });
    });
}

async function removeDir(dirPath, debug = false) {
    await new Promise((resolve, reject) => {
        fs.rm(dirPath, {
            recursive: true,
            maxRetries: 120,
            retryDelay: 500,
        }, (error) => {
            if (error) {
                console.log(chalk.white.bgRed.bold("Unable to remove a directory : " + dirPath));
                process.exit(1);
            } else {
                debug ? console.log("Folder path removed successfully : "+dirPath) : ""; 
                resolve();
            }
        });
    });
}

async function moveFileFromTempDirToDestination(filePath, tempPath, destinationPath, debug = false) {
        debug ? console.log("Moving file from TempDir to Destination : Executing.") : "";
        await moveFile(filePath, filePath.replace(tempPath, destinationPath), debug);
        debug ? console.log("Moving file from TempDir to Destination : Done.") : "";
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

async function getChecksumFromURL(url, hashAlgo, debug = false) {
    return new Promise((resolve, reject) => {
        let body = [];
        https.get(url, (response) => {
            response.on('data', chunk => body.push(chunk));
            response.on('end', async () => {
                if (response.statusCode == 200) {
                    let hashSum = crypto.createHash(hashAlgo);
                    hashSum.update(Buffer.concat(body));
                    const checksumOfFile = hashSum.digest('hex');
                    resolve(checksumOfFile);
                } else {
                    console.log(chalk.white.bgRed.bold("Unable to calculate checksum of the file: "+url));
                    process.exit(1);
                }
            });
            response.on('error', (error) => { reject(error); });
        });
    });
}

async function downloadFileAndCompareWithChecksum(url, file, tempPath, destinationPath, hashAlgo, checksumOfFile, debug = false) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            response.pipe(file);
            file.on("finish", async () => { // after download completed close filestream
                file.close();

                const fileBuffer = fs.readFileSync(file.path);
                let hashSum = crypto.createHash(hashAlgo);
                hashSum.update(fileBuffer);
                if ( checksumOfFile == hashSum.digest('hex')) {
                    await moveFileFromTempDirToDestination(file.path, tempPath+"/", destinationPath, debug);
                    debug ? console.log("Download Completed, File saved as : "+destinationPath+path.basename(file.path)) : process.stdout.write("•");
                }
                resolve();
            })
            response.on('error', (error) => { reject(error); });
        });
    });

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
    for (let cnt = 0; cnt < seconds; cnt++) {
        debug ? process.stdout.write('.') : "";
        await new Promise(r => setTimeout(r, ( 1 * 1000 )));
    }
    debug ? console.log("\nWaiting start for "+seconds+" seconds: Done.") : "";
}

async function handleBookmarkURL(page, dealerFolder, name, URL, debug = false) {
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
            // await waitForSeconds(5);
        } else {
            await getImagesFromContent(page, dealerFolder);
            await waitForSeconds(10, true);
        }
    }
}



async function getImagesFromContent(page, dealerFolder, debug = false) {
    const hashAlgo = "sha1";
    const stock_number = await page.$$eval('input#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_VehicleHeader_StockNumber', el => el.map(x => x.getAttribute("value")));

    const image_div_container = await page.$('.tn-list-container');
    const image_ul_container = await image_div_container.$('.container.tn-list.sortable.deletable.ui-sortable');
    const image_largesrc_urls = await image_ul_container.$$eval('img.tn-car', el => el.map(x => x.getAttribute("largesrc")));
    
    const tempPath = generateTempFolderWithRandomText();
    await makeDir(tempPath, debug);

    var checksumOfFile;
    debug ? "" : process.stdout.write("\t");
    // for (let index = 0; index < image_largesrc_urls.length; index++) { 
    for (let index = 0; index < 2; index++) { 
        debug ? console.log("Downloading image: "+image_largesrc_urls[index]) : process.stdout.write("»");
        const file = fs.createWriteStream(tempPath+"/"+zeroPad((index+1), 3)+".jpg");

        const checksumOfFile = await getChecksumFromURL(image_largesrc_urls[index], hashAlgo, debug);
        await downloadFileAndCompareWithChecksum(image_largesrc_urls[index], file, 
            tempPath, "./Downloads/"+dealerFolder+"/"+stock_number+"/", 
            hashAlgo, checksumOfFile, debug);
    }
    debug ? "" : process.stdout.write("\n");
    await removeDir(tempPath, debug);
}