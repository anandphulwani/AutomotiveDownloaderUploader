import chalk from 'chalk';
import puppeteer from 'puppeteer';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { getCredentialsForUsername, getAppDomain } from './configsupportive.js';
import { fillInTextbox, clickOnButton } from './actionOnElements.js';
import { waitForElementContainsOrEqualsText, waitTillCurrentURLStartsWith } from './waiting.js';
import { gotoPageAndWaitTillCurrentURLStartsWith } from './goto.js';

/* eslint-enable import/extensions */

async function initBrowserAndGetPage() {
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
    return page;
}

async function loginCredentials(page, username) {
    /* #region Login details */
    console.log(chalk.cyan(`Reading/Uploading Bookmarks for the Username: ${chalk.cyan.bold(username)}`));
    const credentials = getCredentialsForUsername(username);
    if (credentials === undefined) {
        console.log(chalk.white.bgYellow.bold(`WARNING: Credentials for ${username} not found in config file, Please declare in config.`));
        // eslint-disable-next-line no-continue
        return false;
    }

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
    await page.waitForSelector('#bridge-bar-user-menu', { timeout: 90000 });
    await page.waitForSelector('.bb-logout', { timeout: 90000 });
    return true;
    /* #endregion */
}
// eslint-disable-next-line import/prefer-default-export
export { initBrowserAndGetPage, loginCredentials };
