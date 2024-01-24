import ping from 'ping';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lgw, lgwc } from './loggerandlocksupportive.js';
import { waitForSeconds } from './sleep.js';
import { getColPosOnTerminal, getRowPosOnTerminal } from './terminal.js';
import { clearLastLinesOnConsole } from './consolesupportive.js';
import { currentTimeWOMSFormatted } from './datetime.js';
import checkBrowserClosed from './browserclosed.js';
/* eslint-ensable import/extensions */

async function warningOfCheckInternetConnectivityHandling(beforeRowOnTerminal, isWarningDisplayed, warnMesg) {
    (await getColPosOnTerminal()) === 0 ? process.stdout.write('\n') : null;
    if (isWarningDisplayed) {
        lgwc(warnMesg);
    } else {
        beforeRowOnTerminal = await getRowPosOnTerminal();
        lgw(warnMesg);
        isWarningDisplayed = true;
    }
    await waitForSeconds(30);
    clearLastLinesOnConsole((await getRowPosOnTerminal()) - beforeRowOnTerminal);
    return isWarningDisplayed;
}

async function checkInternetConnectivity(page, isHandleItself = false) {
    let isWarningDisplayed = false;
    let isInternetConnected = false;
    let beforeRowOnTerminal;
    const hosts = ['8.8.8.8', '8.8.4.4', '4.2.2.2', '208.67.222.222', '208.67.220.220'];
    do {
        // eslint-disable-next-line no-restricted-syntax
        for (const host of hosts) {
            const res = await ping.promise.probe(host, {
                timeout: 10,
            });
            if (res !== undefined && res.alive !== undefined && res.alive === true) {
                isInternetConnected = true;
                break;
            }
        }
        if (isHandleItself && !isInternetConnected) {
            const warnMesg = `[${currentTimeWOMSFormatted()}]: Waiting for Internet Connection to resume ....`;
            isWarningDisplayed = await warningOfCheckInternetConnectivityHandling(beforeRowOnTerminal, isWarningDisplayed, warnMesg);
            // eslint-disable-next-line no-continue
            continue;
        }
        // eslint-disable-next-line no-constant-condition
    } while (false);

    isWarningDisplayed = false;
    let isDNSWorking = false;
    if (isInternetConnected) {
        do {
            const domainNames = ['www.yahoo.com', 'www.google.com', 'www.microsoft.com', 'www.apple.com', 'www.cloudflare.com'];
            // eslint-disable-next-line no-restricted-syntax
            for (const domainName of domainNames) {
                const res = await ping.promise.probe(domainName, {
                    timeout: 10,
                });
                if (res !== undefined && res.alive !== undefined && res.alive === true) {
                    isDNSWorking = true;
                    break;
                }
            }
            if (isHandleItself && !isDNSWorking) {
                const warnMesg = `[${currentTimeWOMSFormatted()}]: Internet present, but unable to resolve DNS i.e. URL --> IP conversion ....`;
                isWarningDisplayed = await warningOfCheckInternetConnectivityHandling(beforeRowOnTerminal, isWarningDisplayed, warnMesg);
                // eslint-disable-next-line no-continue
                continue;
            }
            // eslint-disable-next-line no-constant-condition
        } while (false);
    }

    isWarningDisplayed = false;
    let isAppDomainWorking = false;
    if (isDNSWorking) {
        do {
            const res = await ping.promise.probe(config.appDomain, {
                timeout: 10,
            });
            if (res !== undefined && res.alive !== undefined && res.alive === true) {
                isAppDomainWorking = true;
            }
            if (isHandleItself && !isAppDomainWorking) {
                let warnMesg = `[${currentTimeWOMSFormatted()}]: `;
                warnMesg += `Internet present, DNS present, but unable to connect to '${config.appDomain}' ....`;
                isWarningDisplayed = await warningOfCheckInternetConnectivityHandling(beforeRowOnTerminal, isWarningDisplayed, warnMesg);
                // eslint-disable-next-line no-continue
                continue;
            }
            // eslint-disable-next-line no-constant-condition
        } while (false);
    }

    let isAppDomainHomePageLoading = false;
    if (isAppDomainWorking) {
        do {
            try {
                await page.goto(config.appDomain, { timeout: 60 * 1000, waitUntil: 'domcontentloaded' });
                isAppDomainHomePageLoading = true;
            } catch (err) {
                checkBrowserClosed(err, true);
                let warnMesg = `[${currentTimeWOMSFormatted()}]: `;
                warnMesg += `Internet present, DNS present, '${config.appDomain}' present, unable to open '${config.appDomain}' homepage ....`;
                isWarningDisplayed = await warningOfCheckInternetConnectivityHandling(beforeRowOnTerminal, isWarningDisplayed, warnMesg);
                // eslint-disable-next-line no-continue
                continue;
            }
            // eslint-disable-next-line no-constant-condition
        } while (false);
    }
    return isAppDomainHomePageLoading;
}

// eslint-disable-next-line import/prefer-default-export
export { checkInternetConnectivity };
