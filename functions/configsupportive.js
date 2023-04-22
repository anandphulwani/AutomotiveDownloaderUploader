import chalk from 'chalk';
import fs from 'fs';
import { lockSync, unlockSync, checkSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
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
    for (let lockTryIndex = 0; lockTryIndex <= 10; lockTryIndex++) {
        try {
            if (lockTryIndex === 10) {
                throw new Error('Unable to get lock for the file after 10 retries.');
            }
            const checkLock = checkSync('.\\configs\\config-user.js');
            if (checkLock) {
                await waitForMilliSeconds(50);
            } else {
                lockSync('.\\configs\\config-user.js');
                const currentAllotted = getContractorsCurrentAllotted(contractor);
                if (currentAllotted === allottedQty) {
                    unlockSync('.\\configs\\config-user.js');
                    return;
                }
                const configUser = fs.readFileSync('.\\configs\\config-user.js', 'utf8');

                const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
                const regexExpression = new RegExp(regexString, 'g');
                const newConfigUser = configUser.replace(regexExpression, `$1$2$3${allottedQty}$5`);
                if (configUser === newConfigUser) {
                    console.log(
                        chalk.white.bgRed.bold(
                            `Unable to set contractors: '${contractor}', current allotted quantity to: '${allottedQty}'. Serious issue, please contact developer.`
                        )
                    );
                    unlockSync('.\\configs\\config-user.js');
                    process.exit(1);
                }
                fs.writeFileSync('.\\configs\\config-user.js', newConfigUser, 'utf8');
                unlockSync('.\\configs\\config-user.js');
                break;
            }
        } catch (err) {
            console.log(`${err.message}`);
            process.exit(1);
        }
    }
}

function getContractorsCurrentAllotted(contractor) {
    const configUser = fs.readFileSync('.\\configs\\config-user.js', 'utf8');
    const regexString = `(const configUser = {[\\s|\\S]*contractors: {[\\s|\\S]*${contractor}: {[\\s]*\\n)([ ]*)(currentAllotted: )(\\d+)(,)`;
    const regexExpression = new RegExp(regexString, 'g');
    const match = configUser.match(regexExpression);
    const currentAllotted = match[0].match(regexString)[4];
    return currentAllotted;
}

async function addToContractorsCurrentAllotted(contractor, quantity) {
    let newQuantity = getContractorsCurrentAllotted(contractor);
    newQuantity = parseInt(newQuantity, 10);
    newQuantity += quantity;
    await setContractorsCurrentAllotted(contractor, newQuantity);
}

async function setLastLotNumberAndDate(lastLotNumber, lastLotDate) {
    for (let lockTryIndex = 0; lockTryIndex <= 10; lockTryIndex++) {
        try {
            if (lockTryIndex === 10) {
                throw new Error('Unable to get lock for the file after 10 retries.');
            }
            const checkLock = checkSync('.\\configs\\config.js');
            if (checkLock) {
                await waitForMilliSeconds(50);
            } else {
                lockSync('.\\configs\\config.js');
                const currentLotLastRunNumber = config.lotLastRunNumber;
                const currentLotLastRunDate = config.lotLastRunDate;
                if (currentLotLastRunNumber === lastLotNumber && currentLotLastRunDate === lastLotDate) {
                    unlockSync('.\\configs\\config.js');
                    return;
                }
                let configUser = fs.readFileSync('.\\configs\\config.js', 'utf8');
                let newConfigUser;

                if (currentLotLastRunNumber !== lastLotNumber) {
                    const lastRunNumberRegexString = `(    lotLastRunNumber: ')(.*?)(',\\n)`;
                    const lastRunNumberRegexExpression = new RegExp(lastRunNumberRegexString, 'g');
                    newConfigUser = configUser.replace(lastRunNumberRegexExpression, `$1${lastLotNumber}$3`);
                    if (configUser === newConfigUser) {
                        console.log(
                            chalk.white.bgRed.bold(`Unable to set lastLotNumber: '${lastLotNumber}'. Serious issue, please contact developer.`)
                        );
                        unlockSync('.\\configs\\config.js');
                        process.exit(1);
                    }
                    configUser = newConfigUser;
                }

                if (currentLotLastRunDate !== lastLotDate) {
                    const lastRunDateRegexString = `(    lotLastRunDate: ')(.*?)(',\\n)`;
                    const lastRunDateRegexExpression = new RegExp(lastRunDateRegexString, 'g');
                    newConfigUser = configUser.replace(lastRunDateRegexExpression, `$1${lastLotDate}$3`);
                    if (configUser === newConfigUser) {
                        console.log(chalk.white.bgRed.bold(`Unable to set lastLotDate: '${lastLotDate}'. Serious issue, please contact developer.`));
                        unlockSync('.\\configs\\config.js');
                        process.exit(1);
                    }
                }
                fs.writeFileSync('.\\configs\\config.js', newConfigUser, 'utf8');
                unlockSync('.\\configs\\config.js');
                break;
            }
        } catch (err) {
            console.log(`${err.message}`);
            process.exit(1);
        }
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
