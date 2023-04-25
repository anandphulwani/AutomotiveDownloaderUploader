import chalk from 'chalk';
import puppeteer from 'puppeteer';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername, getAppDomain } from './configsupportive.js';
import { fillInTextbox, clickOnButton } from './actionOnElements.js';
import { waitForElementContainsOrEqualsText, waitTillCurrentURLStartsWith } from './waiting.js';
import { gotoPageAndWaitTillCurrentURLStartsWith } from './goto.js';

/* eslint-enable import/extensions */

async function initBrowserAndGetPage(profile) {
    setChromeProfile(profile);
    const browser = await puppeteer.launch(config.browserArgs);
    const numberOfOpenPages = (await browser.pages()).length;
    if (numberOfOpenPages > 1) {
        console.log(chalk.white.bgRed.bold(`\nGoogle Chrome has older multiple tabs opened, Change google chrome settings:`));
        console.log(chalk.white.bgRed.bold(`        01. Open "chrome://settings/" URL in Google Chrome.`));
        console.log(chalk.white.bgRed.bold(`        02. Search "On startup" in the search bar.`));
        console.log(chalk.white.bgRed.bold(`        03. Select "Open the New Tab page" in the options.`));
        console.log(chalk.white.bgRed.bold(`        04. Close the browser.`));
        process.exit(1);
    }
    const [page] = await browser.pages();
    return { page: page, browser: browser };
}

async function loginCredentials(page, credentials) {
    /* #region Login details */
    await gotoPageAndWaitTillCurrentURLStartsWith(
        page,
        'https://signin.coxautoinc.com/logout?bridge_solution=HME',
        'https://homenetauto.signin.coxautoinc.com/?solutionID=HME_prod&clientId='
    );
    await fillInTextbox(page, '#username', credentials.username);
    await clickOnButton(page, '#signIn', 'Next');
    await waitForElementContainsOrEqualsText(page, '#returnLink', `← ${credentials.username}`, undefined, true);
    await fillInTextbox(page, '#password', credentials.password);
    await clickOnButton(page, '#signIn', 'Sign in');
    await waitTillCurrentURLStartsWith(page, `${getAppDomain()}/dashboard`);
    await page.waitForSelector('#bridge-bar-user-menu > div.bb-popover > div > section.bb-userdata', { timeout: 90000 });
    await page.waitForSelector('.bb-logout', { timeout: 90000 });

    await verifyUserLoggedIn(page, credentials.username);
    return true;
    /* #endregion */
}

async function verifyUserLoggedIn(page, username) {
    // Verify that the user has logged in
    await page.evaluate(
        // eslint-disable-next-line no-loop-func
        (selectorInner, usernameToCompare) =>
            new Promise((resolve, reject) => {
                const intervalId = setInterval(() => {
                    // eslint-disable-next-line no-undef
                    const element = document.querySelector(selectorInner);
                    if (element && element.innerHTML.toLowerCase() === usernameToCompare) {
                        clearInterval(intervalId);
                        resolve();
                    }
                }, 1000);
                setTimeout(() => {
                    clearInterval(intervalId);
                    reject(
                        new Error(
                            `Timeout waiting for element with selector's lowercase "${selectorInner}" to have exact text's lowercase "${usernameToCompare}"`
                        )
                    );
                }, 30000);
            }),
        '#bridge-bar-user-menu > div.bb-popover > div > section.bb-userdata > dl:nth-child(1) > dt.bb-userdatum__value',
        username
    );
}

async function getCurrentUser(page) {
    const logoutButtonSelectorExists = await page.$('.bb-logout');

    if (logoutButtonSelectorExists) {
        const usernameSelector = '#bridge-bar-user-menu > div.bb-popover > div > section.bb-userdata > dl:nth-child(1) > dt.bb-userdatum__value';
        await page.waitForSelector(usernameSelector, { timeout: 30000 });
        const usernameHTML = await page.$eval(usernameSelector, (element) => element.innerHTML);
        return usernameHTML.toLowerCase();
    }
    return null;
}

function setChromeProfile(profile) {
    const filteredArgs = config.browserArgs.args
        .map((item, index) => ({ item, index })) // Create an array of objects with item and index properties
        .filter(({ item }) => item.startsWith('--user-data-dir=')) // Filter out items that don't start with 'abc'
        .map(({ item, index }) => index); // Extract the index of each remaining item
    if (filteredArgs.length === 1 && (profile === 'download' || profile === 'upload')) {
        let userDataDir = filteredArgs[0].item.replace(/^--user-data-dir=/, '');
        userDataDir = userDataDir.split('\\');
        userDataDir.pop();
        if (profile === 'download') {
            userDataDir.push('Download');
        }
        if (profile === 'upload') {
            userDataDir.push('Upload');
        }
        userDataDir = userDataDir.join('\\');
        userDataDir = `--user-data-dir=${userDataDir}`;
        config.browserArgs.args[filteredArgs[0].index] = userDataDir;
    } else {
        throw new Error(`Chrome profile setting option: ${profile} not in the available options 'download' and 'upload'.`);
    }
}
// eslint-disable-next-line import/prefer-default-export
export { initBrowserAndGetPage, loginCredentials, getCurrentUser };
