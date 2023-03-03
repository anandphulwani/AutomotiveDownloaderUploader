import os from 'os';
import fs from 'fs';
import chalk from 'chalk';
import puppeteer from 'puppeteer';
import https from 'https';
import crypto from 'crypto';
import randomstring from 'randomstring';
import path from 'path';
import { NtpTimeSync } from 'ntp-time-sync';
import { getChromeBookmark } from 'chrome-bookmark-reader';
import pos from 'get-cursor-position';
import date from 'date-and-time';
import xlsx from 'xlsx';

// /**
//  * Check if timezone matches of Asia/Calcutta
//  */
// console.log(chalk.cyan("Check if timezone matches of Asia/Calcutta: Executing."));
// if (Intl.DateTimeFormat().resolvedOptions().timeZone != "Asia/Calcutta") {
//     console.log(chalk.white.bgRed.bold("System timezone is not set to India: Asia/Calcutta UTC+5.30 Hours"));
//     process.exit(1);
// } else {
//     console.log(chalk.green.bold("System timezone matches to India: Asia/Calcutta UTC+5.30 Hours"));
// }
// console.log(chalk.cyan("Check if timezone matches of Asia/Calcutta: Done."));
// printSectionSeperator();

// /**
//  * Check if time is in sync with online NTP servers.
//  */
// console.log(chalk.cyan("Check if time is in sync with online NTP servers.: Executing."));
// const timeSync = NtpTimeSync.getInstance();
// await timeSync.getTime().then(function (result) {
//   console.log(chalk.cyan("Current System time: "+ new Date() +",\nReal time (NTP Servers): "+result.now));
//   const offsetInSeconds = Math.abs( Math.round( result.offset / 1000 ) );
//   if ( offsetInSeconds > (2 * 60 ) ) {
//     console.log(chalk.white.bgRed.bold("System time not set accurately, time is off by "+ offsetInSeconds +" seconds ("+result.offset+"ms), \nPlease re sync time with NTP server."));
//     process.exit(1);
//   } else {
//     console.log(chalk.green.bold("System time shows accurate data i.e. (within 2 mins differnce), current offset is "+ offsetInSeconds +" seconds ("+result.offset+"ms)."));
//   }
// })
// console.log(chalk.cyan("Check if time is in sync with online NTP servers.: Done."));
// printSectionSeperator();

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
const dealerConfiguration = readDealerConfiguration();

/**
 * Read chrome bookmarks from chrome browser
 */
// const bookmarkPath = '/path/to/Chrome/Bookmark' OR '%LocalAppData%\\Google\\Chrome\\User Data\\Default\\Bookmarks' //TODO: Change path to default and pick from ini
const bookmarkPath = 'C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data\\Default\\Bookmarks';
const option = {
    shouldIncludeFolders: true,
};
const bookmarks = getChromeBookmark(bookmarkPath, option);

(async () => {
    const browser = await puppeteer.launch({
        headless: false,
        defaultViewport: null,
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        args: ['--user-data-dir=C:\\Users\\Administrator\\AppData\\Local\\Google\\Chrome\\User Data'],
    });
    const [page] = await browser.pages();

    // bookmarks.forEach(async (topLevelBookmark) => {
    // eslint-disable-next-line no-restricted-syntax
    for (const topLevelBookmark of bookmarks) {
        if (topLevelBookmark.name === 'Bookmarks bar') {
            console.log(chalk.cyan('Reading Bookmarks bar from the bookmarks data.'));
            const usernameLevelBookmarks = topLevelBookmark.children;
            // usernameLevelBookmarks.forEach(async (usernameLevelBookmark) => {
            // eslint-disable-next-line no-restricted-syntax
            for (const usernameLevelBookmark of usernameLevelBookmarks) {
                console.log(chalk.cyan(`Reading Bookmarks for the Username: ${chalk.cyan.bold(usernameLevelBookmark.name)}`));

                await gotoPageAndWaitTillCurrentURLStartsWith(
                    page,
                    'https://signin.coxautoinc.com/logout?bridge_solution=HME',
                    'https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId='
                ); // use  (..., undefined, true) as params
                const username = 'dinesharora80@gmail.com';
                const password = 'kunsh123';
                await fillInTextbox(page, '#username', username);
                await clickOnButton(page, '#signIn', 'Next');
                await waitForElementContainsText(page, '#returnLink', `← ${username}`);
                await fillInTextbox(page, '#password', password);
                await clickOnButton(page, '#signIn', 'Sign in');
                await waitTillCurrentURLStartsWith(page, 'https://www.homenetiol.com/dashboard');
                await waitForElementContainsText(page, '.bb-logout', 'Sign out');
                // eslint-disable-next-line no-undef, no-loop-func
                await page.waitForFunction((args) => document.querySelector(args[0]).value.toLowerCase() === args[1].toLowerCase(), {}, [
                    'dt.bb-userdatum__value',
                    username,
                ]);
                await waitForSeconds(10);

                const dealerLevelBookmarks = usernameLevelBookmark.children;
                // dealerLevelBookmarks.forEach(async (dealerLevelBookmark) => {
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelBookmark of dealerLevelBookmarks) {
                    console.log(
                        chalk.cyan('Reading Bookmarks for the Dealer: ') +
                            chalk.cyan.bold(dealerLevelBookmark.name) +
                            chalk.cyan(' from the Username: ') +
                            chalk.cyan.bold(usernameLevelBookmark.name)
                    );
                    const vehicleBookmarks = dealerLevelBookmark.children;
                    // vehicleBookmarks.forEach(async (vehicleBookmark) => {
                    // eslint-disable-next-line no-restricted-syntax
                    for (const vehicleBookmark of vehicleBookmarks) {
                        await handleBookmarkURL(page, dealerLevelBookmark.name, vehicleBookmark.name, vehicleBookmark.url);
                        await waitForSeconds(0);
                    } // });
                } // });
            } // });
        }
    } // });
    await browser.close();
})();
// await sleep(10000);
// process.exit(0);

function msleep(n) {
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, n);
}

function sleep(n) {
    msleep(n * 1000);
}

function zeroPad(num, places) {
    const zero = places - num.toString().length + 1;
    return Array(+(zero > 0 && zero)).join('0') + num;
}

function generateTempFolderWithRandomText(debug = false) {
    const randomFolder = randomstring.generate({
        length: 8,
        charset: 'alphabetic',
        capitalization: 'lowercase',
    });
    debug ? console.log(`Generated random folder name : ${randomFolder}`) : '';
    const tempPathWithRandomFolder = `${os.tmpdir()}/${randomFolder}`;
    debug ? console.log(`Temporary path with suffixed random folder : ${tempPathWithRandomFolder}`) : '';
    return tempPathWithRandomFolder;
}

async function makeDir(dirPath, debug = false) {
    await new Promise((resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (error) => {
            if (error) {
                console.log(chalk.white.bgRed.bold(`Unable to create a directory : ${dirPath}`));
                process.exit(1);
            } else {
                debug ? console.log(`Folder path created successfully : ${dirPath}`) : '';
                resolve();
            }
        });
    });
}

async function moveFile(fromPath, toPath, debug = false) {
    return new Promise((resolve, reject) => {
        fs.rename(fromPath, toPath, (error) => {
            if (error) {
                console.log(
                    chalk.white.bgRed.bold(
                        `${'Unable to move file from the \n\tSource Directory: '}${fromPath} \n\t\t\tTo \n\tDestination Directory: ${toPath}`
                    )
                );
                process.exit(1);
            } else {
                debug
                    ? console.log(
                          `${'File moved successfully from the \n\tSource Directory: '}${fromPath}\n\t\t\tTo \n\tDestination Directory: ${toPath}`
                      )
                    : '';
                resolve();
            }
        });
    });
}

async function createDirAndMoveFile(fromPath, toPath, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Executing.`) : '';
        await makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Done.`) : '';
    }
    await moveFile(fromPath, toPath, debug);
}

async function removeDir(dirPath, debug = false) {
    await new Promise((resolve, reject) => {
        fs.rm(
            dirPath,
            {
                recursive: true,
                maxRetries: 120,
                retryDelay: 500,
            },
            (error) => {
                if (error) {
                    console.log(chalk.white.bgRed.bold(`Unable to remove a directory : ${dirPath}`));
                    process.exit(1);
                } else {
                    debug ? console.log(`Folder path removed successfully : ${dirPath}`) : '';
                    resolve();
                }
            }
        );
    });
}

async function createDirAndMoveFileFromTempDirToDestination(filePath, tempPath, destinationPath, debug = false) {
    debug ? console.log('Moving file from TempDir to Destination : Executing.') : '';
    await createDirAndMoveFile(filePath, filePath.replace(tempPath, destinationPath), debug);
    debug ? console.log('Moving file from TempDir to Destination : Done.') : '';
}

function printSectionSeperator() {
    console.log(chalk.black.bgWhiteBright('-'.repeat(80)));
}

async function getRowPosOnTerminal() {
    return pos.sync().row;
}

async function getChecksumFromURL(url, hashAlgo, debug = false) {
    return new Promise((resolve, reject) => {
        const body = [];
        https.get(url, (response) => {
            response.on('data', (chunk) => body.push(chunk));
            response.on('end', async () => {
                if (response.statusCode === 200) {
                    const hashSum = crypto.createHash(hashAlgo);
                    hashSum.update(Buffer.concat(body));
                    const checksumOfFile = hashSum.digest('hex');
                    resolve(checksumOfFile);
                } else {
                    console.log(chalk.white.bgRed.bold(`Unable to calculate checksum of the file: ${url}`));
                    process.exit(1);
                }
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
    });
}

async function downloadFileAndCompareWithChecksum(url, file, tempPath, destinationPath, isSingleImage, hashAlgo, checksumOfFile, debug = false) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', async () => {
                // after download completed close filestream
                file.close();

                const fileBuffer = fs.readFileSync(file.path);
                const hashSum = crypto.createHash(hashAlgo);
                hashSum.update(fileBuffer);
                if (checksumOfFile === hashSum.digest('hex')) {
                    let filePath = file.path;
                    if (isSingleImage) {
                        const newFilePath = `${path.dirname(filePath)}/${path.basename(destinationPath)}${path.extname(path.basename(filePath))}`;
                        destinationPath = `${path.dirname(destinationPath)}/`;
                        await moveFile(filePath, newFilePath, debug);
                        filePath = newFilePath;
                    }
                    await createDirAndMoveFileFromTempDirToDestination(filePath, `${tempPath}/`, destinationPath, debug);
                    debug
                        ? console.log(chalk.green.bold(`Download Completed, File saved as : ${destinationPath}${path.basename(filePath)}`))
                        : process.stdout.write(chalk.green.bold('• '));
                }
                resolve();
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
    });
}

async function fillInTextbox(page, selector, textToFill, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector);
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
    await page.waitForFunction((selector) => document.querySelector(selector).value === '', {}, selector);
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
    await page.waitForFunction((args) => document.querySelector(args[0]).value === args[1], {}, [selector, textToFill]);
    debug ? console.log(`Checking if ${selector} value matches filled: Done.`) : '';
}

async function clickOnButton(page, selector, buttonText, debug = false) {
    debug ? console.log(`Waiting for the ${selector} to load: Executing.`) : '';
    await page.waitForSelector(selector);
    debug ? console.log(`Waiting for the ${selector} to load: Found.`) : '';

    debug ? console.log(`Check if the ${selector} contains text: ${buttonText}: Executing.`) : '';
    // eslint-disable-next-line no-undef
    await page.waitForFunction((args) => document.querySelector(args[0]).innerText.includes(args[1]), {}, [selector, buttonText]);
    debug ? console.log(`Check if the ${selector} contains text: ${buttonText}: Found.`) : '';

    debug ? console.log(`Clicking the ${selector} button: Executing.`) : '';
    await page.click(selector);
    debug ? console.log(`Clicking the ${selector} button: Done.`) : '';
}

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

async function waitForSeconds(seconds, debug = false) {
    debug ? process.stdout.write(`Waiting start for ${seconds} seconds: Executing.  `) : '';
    for (let cnt = 0; cnt < seconds; cnt++) {
        debug ? process.stdout.write('.') : '';
        // eslint-disable-next-line no-promise-executor-return
        await new Promise((r) => setTimeout(r, 1 * 1000));
    }
    debug ? console.log(`\nWaiting start for ${seconds} seconds: Done.`) : '';
}

async function handleBookmarkURL(page, dealerFolder, name, URL, debug = false) {
    if (URL.startsWith('https://www.homenetiol.com/inventory/photo-manager?')) {
        console.log(chalk.magenta(`\t${name} : ${URL} : Gallery URL ...... (Ignoring)`));
    } else {
        const startingRow = await getRowPosOnTerminal();
        process.stdout.write(chalk.cyan(`\t${name} : ${URL}\n`));
        const endingRow = await getRowPosOnTerminal();
        const diffInRows = endingRow - startingRow;
        await gotoURL(page, URL, debug);
        if (page.url().startsWith('https://www.homenetiol.com/dashboard?')) {
            debug ? '' : process.stdout.moveCursor(0, -diffInRows); // up one line
            debug ? '' : process.stdout.clearLine(diffInRows); // from cursor to end
            debug ? '' : process.stdout.cursorTo(0);
            process.stdout.write(chalk.red.bold(`\t${name} : ${URL} : Supplied URL doesn't exist ...... (Ignoring)\n`));
            await waitForSeconds(5);
        } else {
            await getImagesFromContent(page, dealerFolder);
            // await waitForSeconds(10, true);
        }
    }
}

async function getImagesFromContent(page, dealerFolder, debug = false) {
    const hashAlgo = 'sha1';
    const stockNumber = await page.$$eval('input#ctl00_ctl00_ContentPlaceHolder_ContentPlaceHolder_VehicleHeader_StockNumber', (el) =>
        el.map((x) => x.getAttribute('value'))
    );

    const imageDIVContainer = await page.$('.tn-list-container');
    const imageULContainer = await imageDIVContainer.$('.container.tn-list.sortable.deletable.ui-sortable');
    const imageOriginalURLS = await imageULContainer.$$eval('img.tn-car', (el) => el.map((x) => x.getAttribute('originalUrl')));

    const tempPath = generateTempFolderWithRandomText();
    await makeDir(tempPath, debug);

    debug ? '' : process.stdout.write('\t');
    const imageNumbersToDownload = getImageNumbersToDownloadFromDC(dealerFolder, 'Image numbers to download');
    for (let index = 0; index < imageNumbersToDownload.length; index++) {
        // for (let index = 0; index < imageOriginalURLS.length; index++) {
        const imageNumberToDownload = parseInt(imageNumbersToDownload[index], 10);
        if (imageNumberToDownload >= imageOriginalURLS.length) {
            //  TODO: Continue prompt here.
            process.exit(1);
        }
        debug ? console.log(`Downloading image: ${imageOriginalURLS[imageNumberToDownload]}`) : process.stdout.write('»');
        const file = fs.createWriteStream(`${tempPath}/${zeroPad(index + 1, 3)}.jpg`);

        const checksumOfFile = await getChecksumFromURL(imageOriginalURLS[imageNumberToDownload], hashAlgo, debug);
        await downloadFileAndCompareWithChecksum(
            imageOriginalURLS[imageNumberToDownload],
            file,
            tempPath,
            `./Downloads/${todaysDate}/${dealerFolder}/${stockNumber}/`,
            imageNumbersToDownload.length === 1,
            hashAlgo,
            checksumOfFile,
            debug
        );
    }
    debug ? '' : process.stdout.write('\n');
    await removeDir(tempPath, debug);
}

function readDealerConfiguration() {
    const file = xlsx.readFile('./configs/DealerConfiguration.xlsx');
    const data = [];
    const sheets = file.SheetNames;
    for (let i = 0; i < sheets.length; i++) {
        const temp = xlsx.utils.sheet_to_json(file.Sheets[file.SheetNames[i]], {
            // range: "",
            raw: false,
            // header: 1,
        });
        temp.forEach((res) => {
            data.push(res);
        });
    }
    return data; // console.log(data); // Printing data
}

function getImageNumbersToDownloadFromDC(dealerNumber, settingName) {
    const singleelement = dealerConfiguration.filter((a) => a['Dealer Number'] === dealerNumber)[0];
    const imageNumbersToDownload = singleelement[settingName].trim();
    return imageNumbersToDownload.split(',');
}
