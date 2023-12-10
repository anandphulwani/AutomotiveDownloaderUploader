import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { getProjectConfigFilePath } from './projectpaths.js';
import { zeroPad } from './stringformatting.js';
import { attainLock, releaseLock } from './locksupportive.js';
import { lgccyclicdependency } from './loggercyclicdependency.js';
/* eslint-enable import/extensions */

// ONPROJECTFINISH: Check if all codes are present in log files which are generated because winston is found to not log in files just before process.exit(1)
/* #region getLastNonCatchErrorLogLevels9DigitUniqueId(), generateAndGetNonCatchErrorLogLevels9DigitUniqueId() : Begin */
function getLastNonCatchErrorLogLevels9DigitUniqueId() {
    const configContent = fs.readFileSync(getProjectConfigFilePath(), 'utf8');
    const lastNonCatchErrorRegexString = `(    nonCatchErrorLogLevels9DigitUniqueId: ')(.*?)(',\\r\\n)`;
    const lastNonCatchErrorRegexExpression = new RegExp(lastNonCatchErrorRegexString, 'g');

    if (!lastNonCatchErrorRegexExpression.test(configContent)) {
        lgccyclicdependency('Unable to match regex for fn getLastNonCatchErrorLogLevels9DigitUniqueId()');
        process.exit(1);
    }

    const match = configContent.match(lastNonCatchErrorRegexExpression);
    let lastNonCatchErrorLogLevels9DigitUniqueId = match[0].match(lastNonCatchErrorRegexString)[2];
    lastNonCatchErrorLogLevels9DigitUniqueId = lastNonCatchErrorLogLevels9DigitUniqueId !== '' ? lastNonCatchErrorLogLevels9DigitUniqueId : '0';
    return lastNonCatchErrorLogLevels9DigitUniqueId;
}

function generateAndGetNonCatchErrorLogLevels9DigitUniqueId() {
    const fileToOperateOn = getProjectConfigFilePath();
    attainLock(fileToOperateOn, undefined, true);

    let nonCatchErrorCode;
    try {
        const currentNonCatchErrorLogLevels9DigitUniqueId = getLastNonCatchErrorLogLevels9DigitUniqueId();
        const configContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const currentNonCatchErrorRegexString = `(    nonCatchErrorLogLevels9DigitUniqueId: ')(.*?)(',\\r\\n)`;
        const currentNonCatchErrorRegexExpression = new RegExp(currentNonCatchErrorRegexString, 'g');

        if (!currentNonCatchErrorRegexExpression.test(configContent)) {
            lgccyclicdependency('Unable to match regex for fn generateAndGetNonCatchErrorLogLevels9DigitUniqueId()');
            process.exit(1);
        }

        nonCatchErrorCode = parseInt(currentNonCatchErrorLogLevels9DigitUniqueId, 10);
        nonCatchErrorCode += 1;
        nonCatchErrorCode = zeroPad(nonCatchErrorCode, 9);
        const newConfigContent = configContent.replace(currentNonCatchErrorRegexExpression, `$1${nonCatchErrorCode}$3`);

        if (newConfigContent === undefined) {
            console.log(
                chalk.white.bgRed.bold(
                    `Unable to set nonCatchErrorLogLevels9DigitUniqueId: '${nonCatchErrorCode}'. Serious issue, please contact developer.`
                )
            );
            releaseLock(fileToOperateOn, undefined, true);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        releaseLock(fileToOperateOn, undefined, true);
    } catch (err) {
        console.log(`${err.message}`);
        process.exit(1);
    }
    return nonCatchErrorCode;
}
/* #endregion getLastNonCatchErrorLogLevels9DigitUniqueId(), generateAndGetNonCatchErrorLogLevels9DigitUniqueId() : End */

/* #region getLastCatchErrorLogLevels6DigitUniqueId(), generateAndGetCatchErrorLogLevels6DigitUniqueId() : Begin */
function getLastCatchErrorLogLevels6DigitUniqueId() {
    const configContent = fs.readFileSync(getProjectConfigFilePath(), 'utf8');
    const lastCatchErrorRegexString = `(    catchErrorLogLevels6DigitUniqueId: ')(.*?)(',\\r\\n)`;
    const lastCatchErrorRegexExpression = new RegExp(lastCatchErrorRegexString, 'g');

    if (!lastCatchErrorRegexExpression.test(configContent)) {
        lgccyclicdependency('Unable to match regex for fn getLastCatchErrorLogLevels6DigitUniqueId()');
        process.exit(1);
    }

    const match = configContent.match(lastCatchErrorRegexExpression);
    let lastLastCatchErrorLogLevels6DigitUniqueId = match[0].match(lastCatchErrorRegexString)[2];
    lastLastCatchErrorLogLevels6DigitUniqueId = lastLastCatchErrorLogLevels6DigitUniqueId !== '' ? lastLastCatchErrorLogLevels6DigitUniqueId : '0';
    return lastLastCatchErrorLogLevels6DigitUniqueId;
}

function generateAndGetCatchErrorLogLevels6DigitUniqueId() {
    const fileToOperateOn = getProjectConfigFilePath();
    attainLock(fileToOperateOn, undefined, true);

    let catchErrorCode;
    try {
        const currentCatchErrorLogLevels6DigitUniqueId = getLastCatchErrorLogLevels6DigitUniqueId();
        const configContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const currentCatchErrorRegexString = `(    catchErrorLogLevels6DigitUniqueId: ')(.*?)(',\\r\\n)`;
        const currentCatchErrorRegexExpression = new RegExp(currentCatchErrorRegexString, 'g');

        if (!currentCatchErrorRegexExpression.test(configContent)) {
            lgccyclicdependency('Unable to match regex for fn generateAndGetCatchErrorLogLevels6DigitUniqueId()');
            process.exit(1);
        }

        catchErrorCode = parseInt(currentCatchErrorLogLevels6DigitUniqueId, 10);
        catchErrorCode += 1;
        catchErrorCode = zeroPad(catchErrorCode, 6);
        const newConfigContent = configContent.replace(currentCatchErrorRegexExpression, `$1${catchErrorCode}$3`);

        if (newConfigContent === undefined) {
            console.log(
                chalk.white.bgRed.bold(
                    `Unable to set catchErrorLogLevels6DigitUniqueId: '${catchErrorCode}'. Serious issue, please contact developer.`
                )
            );
            releaseLock(fileToOperateOn, undefined, true);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        releaseLock(fileToOperateOn, undefined, true);
    } catch (err) {
        console.log(`${err.message}`);
        process.exit(1);
    }
    return catchErrorCode;
}
/* #endregion getLastCatchErrorLogLevels6DigitUniqueId(), generateAndGetCatchErrorLogLevels6DigitUniqueId() : End */

export {
    getLastNonCatchErrorLogLevels9DigitUniqueId,
    generateAndGetNonCatchErrorLogLevels9DigitUniqueId,
    getLastCatchErrorLogLevels6DigitUniqueId,
    generateAndGetCatchErrorLogLevels6DigitUniqueId,
};
