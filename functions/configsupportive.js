import chalk from 'chalk';
import fs from 'fs';
import { lockSync, unlockSync, checkSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { lgc } from './loggersupportive.js';
import { config } from '../configs/config.js';
import { waitForMilliSeconds } from './sleep.js';
/* eslint-enable import/extensions */

function getCredentialsForUsername(username) {
    const configCredentials = config.credentials;
    const singleelement = configCredentials.filter((a) => a.username === username)[0];
    return singleelement;
    // const { password } = singleelement;
    // return password;
}

function getIgnoreBookmarkURLObjects() {
    const ignoreBookmarkURLObjects = config.ignoreBookmarkURLS;
    let ignoreBookmarkURLText = JSON.stringify(ignoreBookmarkURLObjects);
    ignoreBookmarkURLText = ignoreBookmarkURLText.replaceAll('{config.appDomain}', config.appDomain);
    return JSON.parse(ignoreBookmarkURLText);
}

function getAppDomain() {
    return config.appDomain;
}

async function setContractorsCurrentAllotted(contractor, allottedQty) {
    const fileToOperateOn = '.\\configs\\config-user.js';
    for (let lockTryIndex = 0; lockTryIndex <= 30; lockTryIndex++) {
        if (lockTryIndex === 30) {
            console.log(`Unable to get the lock`);
            process.exit(1);
        }
        try {
            const checkLock = checkSync(fileToOperateOn);
            if (checkLock) {
                await waitForMilliSeconds(50 + lockTryIndex * 3);
                // eslint-disable-next-line no-continue
                continue;
            }
            lockSync(fileToOperateOn);
            break;
        } catch (error) {
            console.log(`${error.message}`);
            console.log(`This piece of code should be unreachable.`);
        }
    }

    try {
        const currentAllotted = getContractorsCurrentAllotted(contractor);
        if (currentAllotted === allottedQty) {
            unlockSync(fileToOperateOn);
            return;
        }
        const configUserContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\r\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
        const regexExpression = new RegExp(regexString, 'g');
        const newConfigUserContent = configUserContent.replace(regexExpression, `$1$2$3${allottedQty}$5`);
        if (configUserContent === newConfigUserContent) {
            console.log(
                chalk.white.bgRed.bold(
                    `Unable to set contractors: '${contractor}', current allotted quantity to: '${allottedQty}'. Serious issue, please contact developer.`
                )
            );
            unlockSync(fileToOperateOn);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigUserContent, 'utf8');
        unlockSync(fileToOperateOn);
    } catch (err) {
        lgc(err);
        process.exit(1);
    }
}

function getContractorsCurrentAllotted(contractor) {
    const configUserContent = fs.readFileSync('.\\configs\\config-user.js', 'utf8');
    const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\r\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
    const regexExpression = new RegExp(regexString, 'g');
    const match = configUserContent.match(regexExpression);
    const currentAllotted = match[0].match(regexString)[4];
    return currentAllotted;
}

async function addToContractorsCurrentAllotted(contractor, quantity) {
    let newQuantity = getContractorsCurrentAllotted(contractor);
    newQuantity = parseInt(newQuantity, 10);
    newQuantity += quantity;
    await setContractorsCurrentAllotted(contractor, newQuantity);
}

function getLastLotNumber() {
    const configContent = fs.readFileSync('.\\configs\\config.js', 'utf8');
    const lastLotNumberRegexString = `(    lotLastRunNumber: ')(.*?)(',\\r\\n)`;
    const lastLotNumberRegexExpression = new RegExp(lastLotNumberRegexString, 'g');

    if (!lastLotNumberRegexExpression.test(configContent)) {
        lgc('Unable to match regex for fn getLastLotNumber()');
        process.exit(1);
    }
    const match = configContent.match(lastLotNumberRegexExpression);
    return match[0].match(lastLotNumberRegexString)[2];
}

function getLastLotDate() {
    const configContent = fs.readFileSync('.\\configs\\config.js', 'utf8');
    const lastLotDateRegexString = `(    lotLastRunDate: ')(.*?)(',\\r\\n)`;
    const lastLotDateRegexExpression = new RegExp(lastLotDateRegexString, 'g');

    if (!lastLotDateRegexExpression.test(configContent)) {
        lgc('Unable to match regex for fn getLastLotDate()');
        process.exit(1);
    }
    const match = configContent.match(lastLotDateRegexExpression);
    return match[0].match(lastLotDateRegexString)[2];
}

async function setLastLotNumberAndDate(lastLotNumber, lastLotDate) {
    const fileToOperateOn = '.\\configs\\config.js';
    for (let lockTryIndex = 0; lockTryIndex <= 30; lockTryIndex++) {
        if (lockTryIndex === 30) {
            console.log(`Unable to get the lock`);
            process.exit(1);
        }
        try {
            const checkLock = checkSync(fileToOperateOn);
            if (checkLock) {
                await waitForMilliSeconds(50 + lockTryIndex * 3);
                // eslint-disable-next-line no-continue
                continue;
            }
            lockSync(fileToOperateOn);
            break;
        } catch (error) {
            console.log(`${error.message}`);
            console.log(`This piece of code should be unreachable.`);
        }
    }

    try {
        const currentLotLastRunNumber = getLastLotNumber();
        const currentLotLastRunDate = getLastLotDate();
        if (currentLotLastRunNumber === lastLotNumber && currentLotLastRunDate === lastLotDate) {
            unlockSync(fileToOperateOn);
            return;
        }
        let configContent = fs.readFileSync(fileToOperateOn, 'utf8');
        let newConfigContent;

        if (currentLotLastRunNumber !== lastLotNumber) {
            const lastRunNumberRegexString = `(    lotLastRunNumber: ')(.*?)(',\\r\\n)`;
            const lastRunNumberRegexExpression = new RegExp(lastRunNumberRegexString, 'g');
            newConfigContent = configContent.replace(lastRunNumberRegexExpression, `$1${lastLotNumber}$3`);
            if (configContent === newConfigContent) {
                console.log(chalk.white.bgRed.bold(`Unable to set lastLotNumber: '${lastLotNumber}'. Serious issue, please contact developer.`));
                unlockSync(fileToOperateOn);
                process.exit(1);
            }
            configContent = newConfigContent;
        }

        if (currentLotLastRunDate !== lastLotDate) {
            const lastRunDateRegexString = `(    lotLastRunDate: ')(.*?)(',\\r\\n)`;
            const lastRunDateRegexExpression = new RegExp(lastRunDateRegexString, 'g');
            newConfigContent = configContent.replace(lastRunDateRegexExpression, `$1${lastLotDate}$3`);
            if (configContent === newConfigContent) {
                console.log(chalk.white.bgRed.bold(`Unable to set lastLotDate: '${lastLotDate}'. Serious issue, please contact developer.`));
                unlockSync(fileToOperateOn);
                process.exit(1);
            }
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        unlockSync(fileToOperateOn);
    } catch (err) {
        console.log(`${err.message}`);
        process.exit(1);
    }
}

// eslint-disable-next-line import/prefer-default-export
export {
    getCredentialsForUsername,
    getIgnoreBookmarkURLObjects,
    getAppDomain,
    setContractorsCurrentAllotted,
    getContractorsCurrentAllotted,
    addToContractorsCurrentAllotted,
    setLastLotNumberAndDate,
};
