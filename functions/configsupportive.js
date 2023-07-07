import chalk from 'chalk';
import fs from 'fs';

/* eslint-disable import/extensions */
import { lgc } from './loggersupportive.js';
import { config } from '../configs/config.js';
import { waitForMilliSeconds } from './sleep.js';
import { attainLock, releaseLock } from './locksupportive.js';
import { createBackupOfFile } from './datastoresupportive.js';
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
    attainLock(fileToOperateOn, true);

    try {
        const currentAllotted = getContractorsCurrentAllotted(contractor);
        if (currentAllotted === allottedQty) {
            releaseLock(fileToOperateOn, true);
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
            releaseLock(fileToOperateOn, true);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigUserContent, 'utf8');
        createBackupOfFile(fileToOperateOn, newConfigUserContent);
        releaseLock(fileToOperateOn, true);
    } catch (err) {
        lgc(err);
        process.exit(1);
    }
}

function getContractorsCurrentAllotted(contractor) {
    const configUserContent = fs.readFileSync('.\\configs\\config-user.js', 'utf8');
    const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\r\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
    const regexExpression = new RegExp(regexString, 'g');

    if (!regexExpression.test(configUserContent)) {
        lgc('Unable to match regex for fn getContractorsCurrentAllotted()');
        process.exit(1);
    }

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
    attainLock(fileToOperateOn, true);

    try {
        const currentLotLastRunNumber = getLastLotNumber();
        const currentLotLastRunDate = getLastLotDate();
        if (currentLotLastRunNumber === lastLotNumber && currentLotLastRunDate === lastLotDate) {
            releaseLock(fileToOperateOn, true);
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
                releaseLock(fileToOperateOn, true);
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
                releaseLock(fileToOperateOn, true);
                process.exit(1);
            }
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        createBackupOfFile(fileToOperateOn, newConfigContent);
        releaseLock(fileToOperateOn, true);
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
