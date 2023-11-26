import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { checkSync, lockSync, unlockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { msleep } from './sleep.js';
import { zeroPad } from './stringformatting.js';
import { instanceRunDateFormatted, instanceRunTimeWOMS, currentTime } from './datetime.js';
import { getProjectLogsDirPath, getProjectConfigUniqueIdsFilePath } from './projectpaths.js';
import {
    loggerFile,
    loggerConsole,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportUnreachableFileWinston,
    addIndividualTransportSevereFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportHiccupFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
    addIndividualTransportVerboseFileWinston,
    addIndividualTransportDebugFileWinston,
    addIndividualTransportTraceFileWinston,
    addIndividualTransportBillyFileWinston,
} from './logger.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import CallerHierarchyAndUniqueId from '../class/CallerHierarchyAndUniqueId.js';
/* eslint-enable import/extensions */

/* #region callerDetails.js */
/*
 *
 *                      ▀██  ▀██                  ▀██▀▀█▄             ▄            ██  ▀██                 ██
 *        ▄▄▄▄   ▄▄▄▄    ██   ██    ▄▄▄▄  ▄▄▄ ▄▄   ██   ██    ▄▄▄▄  ▄██▄   ▄▄▄▄   ▄▄▄   ██   ▄▄▄▄         ▄▄▄  ▄▄▄▄
 *      ▄█   ▀▀ ▀▀ ▄██   ██   ██  ▄█▄▄▄██  ██▀ ▀▀  ██    ██ ▄█▄▄▄██  ██   ▀▀ ▄██   ██   ██  ██▄ ▀          ██ ██▄ ▀
 *      ██      ▄█▀ ██   ██   ██  ██       ██      ██    ██ ██       ██   ▄█▀ ██   ██   ██  ▄ ▀█▄▄         ██ ▄ ▀█▄▄
 *       ▀█▄▄▄▀ ▀█▄▄▀█▀ ▄██▄ ▄██▄  ▀█▄▄▄▀ ▄██▄    ▄██▄▄▄█▀   ▀█▄▄▄▀  ▀█▄▀ ▀█▄▄▀█▀ ▄██▄ ▄██▄ █▀▄▄█▀         ██ █▀▄▄█▀
 *                                                                                                  ██  ▄▄ █▀
 *                                                                                                       ▀▀
 */
function extractCallerDetailsFromStack(stack) {
    const callerDetailsList = [];
    const stackTrace = stack.split('\n');
    if (stackTrace[0].match(/^[a-zA-Z]*Error:/) || stackTrace[0] === 'Error') {
        stackTrace.shift();
    } else {
        const mesg = `Logger error: Unable to match the first line, it doesnt contain anything like 'Error: ' in the line: \n${stackTrace[0]}\nError Stack:\n${stack}`;
        lgu(mesg);
        process.exit(1);
    }
    while (stackTrace.length > 0) {
        const regexOfAtFilenameLineNumber = /at (?:([^\\/]+) )?\(?(.+)[\\/](.+?):(\d+):(\d+)\)?/;
        const regexOfNodeInternal = / \(node:internal/;
        const regexOfgetCallerDetails =
            /at (getCallerDetailsList |getCallerDetails |getCallerHierarchyFormatted |getCallerFormatted |getCallerHierarchyWithFunctionNameFormatted )(.*)/;
        const regexOfLoggerFunctions = /at (lg[\S][\S]? )(.*)/;
        if (
            stackTrace[0].match(regexOfAtFilenameLineNumber) === null ||
            stackTrace[0].match(regexOfgetCallerDetails) !== null ||
            stackTrace[0].match(regexOfNodeInternal) !== null ||
            stackTrace[0].match(regexOfLoggerFunctions) !== null
        ) {
            stackTrace.shift();
            // eslint-disable-next-line no-continue
            continue;
        }
        const stackDetailsCatchLine = stackTrace[0].match(regexOfAtFilenameLineNumber);
        callerDetailsList.push({
            functionName: stackDetailsCatchLine[1] !== undefined ? stackDetailsCatchLine[1] : '',
            pathToFile: stackDetailsCatchLine[2] !== undefined ? stackDetailsCatchLine[2] : '',
            filename: stackDetailsCatchLine[3] !== undefined ? stackDetailsCatchLine[3] : '',
            lineNumber: stackDetailsCatchLine[4] !== undefined ? stackDetailsCatchLine[4] : '',
            columnNumber: stackDetailsCatchLine[5] !== undefined ? stackDetailsCatchLine[5] : '',
        });
        stackTrace.shift();
    }
    return callerDetailsList;
}

const getCallerDetailsList = (...args) => {
    let callerDetailsList = [];
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        if (arg instanceof Error) {
            callerDetailsList = extractCallerDetailsFromStack(arg.stack);
            if (callerDetailsList.length === 0) {
                const mesg = `Logger error: Unable to extract filename and linenumber from the following stack which was sent: \n${arg.stack}.`;
                lgu(mesg);
            }
            break;
        }
    }
    if (callerDetailsList.length === 0) {
        const { stack } = new Error();
        callerDetailsList = extractCallerDetailsFromStack(stack);
        if (callerDetailsList.length === 0) {
            const mesg = `Logger error: Unable to extract filename and linenumber from the following stack which was generated to detect caller details: \n${stack}.`;
            lgu(mesg);
        }
    }
    return callerDetailsList;
};

const getCallerFormatted = (...args) => {
    const callerDetailsList = getCallerDetailsList(...args);
    const callerDetails = callerDetailsList.shift();
    return `${callerDetails.filename}:${callerDetails.lineNumber}`;
};

const getCallerHierarchyFormatted = (...args) => {
    const callerDetailsList = getCallerDetailsList(...args);
    const groupedByFilename = callerDetailsList.reduce((acc, { filename, lineNumber }) => {
        acc[filename] = acc[filename] || [];
        acc[filename].push(lineNumber);
        return acc;
    }, {});

    const output = Object.entries(groupedByFilename)
        .map(([filename, lineNumbers]) => `${filename}:${lineNumbers.join(',')}`)
        .join('; ');
    return output;
};

const getCallerHierarchyWithFunctionNameFormatted = (...args) => {
    let callerDetailsList;
    if (Array.isArray(args[0])) {
        [callerDetailsList] = args;
    } else {
        callerDetailsList = getCallerDetailsList(...args);
    }
    return callerDetailsList.map((detail) => `{${detail.functionName}}${detail.filename}:${detail.lineNumber}`).join('; ');
};

const getCallerDetails = (...args) => {
    let callerDetailsList;
    if (Array.isArray(args[0])) {
        [callerDetailsList] = args;
    } else {
        callerDetailsList = getCallerDetailsList(...args);
    }
    return callerDetailsList.shift();
};
/* #endregion */

/* #region attainLock, releaseLock */
/**
 *
 *      ▀██                  ▀██                                                          ▄    ██                           ██
 *       ██    ▄▄▄     ▄▄▄▄   ██  ▄▄   ▄▄▄▄  ▄▄▄ ▄▄▄  ▄▄▄ ▄▄▄  ▄▄▄ ▄▄▄    ▄▄▄   ▄▄▄ ▄▄  ▄██▄  ▄▄▄  ▄▄▄▄ ▄▄▄   ▄▄▄▄         ▄▄▄  ▄▄▄▄
 *       ██  ▄█  ▀█▄ ▄█   ▀▀  ██ ▄▀   ██▄ ▀   ██  ██   ██▀  ██  ██▀  ██ ▄█  ▀█▄  ██▀ ▀▀  ██    ██   ▀█▄  █  ▄█▄▄▄██         ██ ██▄ ▀
 *       ██  ██   ██ ██       ██▀█▄   ▄ ▀█▄▄  ██  ██   ██    █  ██    █ ██   ██  ██      ██    ██    ▀█▄█   ██              ██ ▄ ▀█▄▄
 *      ▄██▄  ▀█▄▄█▀  ▀█▄▄▄▀ ▄██▄ ██▄ █▀▄▄█▀  ▀█▄▄▀█▄  ██▄▄▄▀   ██▄▄▄▀   ▀█▄▄█▀ ▄██▄     ▀█▄▀ ▄██▄    ▀█     ▀█▄▄▄▀         ██ █▀▄▄█▀
 *                                                     ██       ██                                                   ██  ▄▄ █▀
 *                                                    ▀▀▀▀     ▀▀▀▀                                                       ▀▀
 *
 *      ▀██                  ▀██                 ▄▀█▄                             ▄    ██
 *       ██    ▄▄▄     ▄▄▄▄   ██  ▄▄           ▄██▄   ▄▄▄ ▄▄▄  ▄▄ ▄▄▄     ▄▄▄▄  ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄    ▄▄▄▄
 *       ██  ▄█  ▀█▄ ▄█   ▀▀  ██ ▄▀             ██     ██  ██   ██  ██  ▄█   ▀▀  ██    ██  ▄█  ▀█▄  ██  ██  ██▄ ▀
 *       ██  ██   ██ ██       ██▀█▄             ██     ██  ██   ██  ██  ██       ██    ██  ██   ██  ██  ██  ▄ ▀█▄▄
 *      ▄██▄  ▀█▄▄█▀  ▀█▄▄▄▀ ▄██▄ ██▄          ▄██▄    ▀█▄▄▀█▄ ▄██▄ ██▄  ▀█▄▄▄▀  ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ █▀▄▄█▀
 *
 */
/**
 *
 * stale : 15000
 * Tried setting stale to 5000 (5 secs) which is the lowest possible threshold, but unable to acquire lock in 5 seconds
 * and operation failed, so giving stale option of 15000 (15 secs), which is more than enough to acquire the lock. but once the
 * log is acquired, if the process which has acquired the lock in on, till that time stale has no meaning, stale then comes into
 * action only when the process holding the lock had ended or released. If the lock is released, stale has no meaning, if it has abruptly
 * being end then the stale is the time, till which the lock is considered active.
 *
 */
// Attemp to attainLock, retrying multiple times in a duration of 5 to 10 mins, before timing out
function attainLock(fileToOperateOn, stale = 15000, debug = false) {
    const callerDetailsList = getCallerDetailsList(new Error().stack).slice(1);
    const callerWithFunctionNameHierarchy = getCallerHierarchyWithFunctionNameFormatted(callerDetailsList);
    const callerFunctionName = getCallerDetails(callerDetailsList).functionName;
    const logPath = path.join(getProjectLogsDirPath(), 'lockslog', instanceRunDateFormatted, instanceRunTimeWOMS, path.basename(fileToOperateOn));
    try {
        fs.mkdirSync(logPath, { recursive: true });
        for (let lockTryIndex = 0; lockTryIndex <= 12000; lockTryIndex++) {
            if (lockTryIndex === 12000) {
                lgs(`attainLock(${fileToOperateOn}): Unable to get the lock.`);
                if (debug) {
                    fs.appendFileSync(
                        `${logPath}/00_${currentTime()}_UNABLE_TO_GET_A_LOCK-caller_${callerFunctionName}.txt`,
                        `Unable to get the lock on '${fileToOperateOn}', caller: ${callerWithFunctionNameHierarchy}.\n`
                    );
                }
                process.exit(1);
            } else if (lockTryIndex !== 0 && lockTryIndex % 1500 === 0) {
                lgs(`Trying to get a lock on: \n${fileToOperateOn}    ......`);
            } else if (lockTryIndex !== 0 && lockTryIndex % 300 === 0) {
                process.stdout.write(chalk.cyan(` ■`));
            }
            if (checkSync(fileToOperateOn, { stale: stale })) {
                if (debug) {
                    fs.appendFileSync(
                        `${logPath}/${currentTime()}_.....LockAlready-caller_${callerFunctionName}.txt`,
                        `....... Lock on '${fileToOperateOn}' is already with someone, Waiting and trying again, caller: ${callerWithFunctionNameHierarchy}.\n`
                    );
                }
                const radomNumberBetween25and50 = Math.floor(Math.random() * (50 - 25 + 1)) + 25;
                msleep(radomNumberBetween25and50);
                // eslint-disable-next-line no-continue
                continue;
            }
            try {
                lockSync(fileToOperateOn, { stale: stale });
            } catch (error) {
                if (error.message.trim() === 'Lock file is already being held') {
                    // eslint-disable-next-line no-continue
                    continue;
                } else {
                    throw error;
                }
            }
            if (debug) {
                fs.appendFileSync(
                    `${logPath}/${currentTime()}_AttainedLock_${callerFunctionName}.txt`,
                    `Got A Lock On '${fileToOperateOn}', caller: ${callerWithFunctionNameHierarchy}.\n`
                );
            }
            break;
        }
    } catch (error) {
        lgu(`attainLock(${fileToOperateOn}) section catch block called.`, error);
        lgu(`attainLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerWithFunctionNameHierarchy}.\n`);
        if (debug) {
            fs.appendFileSync(
                `${logPath}/00_${currentTime()}_CatchError_${callerFunctionName}.txt`,
                `fn attainLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerWithFunctionNameHierarchy}.\n`
            );
        }
        process.exit(1);
    }
}

function releaseLock(fileToOperateOn, stale = 15000, debug = false) {
    const callerDetailsList = getCallerDetailsList(new Error().stack).slice(1);
    const callerWithFunctionNameHierarchy = getCallerHierarchyWithFunctionNameFormatted(callerDetailsList);
    const callerFunctionName = getCallerDetails(callerDetailsList).functionName;
    const logPath = path.join(getProjectLogsDirPath(), 'lockslog', instanceRunDateFormatted, instanceRunTimeWOMS, path.basename(fileToOperateOn));
    try {
        fs.mkdirSync(logPath, { recursive: true });
        if (checkSync(fileToOperateOn, { stale: stale })) {
            const filename = `${logPath}/${currentTime()}_ReleasedLock_${callerFunctionName}.txt`;
            unlockSync(fileToOperateOn);
            if (debug) {
                fs.appendFileSync(filename, `Released A Lock On '${fileToOperateOn}', caller: ${callerWithFunctionNameHierarchy}.\n`);
            }
        }
    } catch (error) {
        lgu(`releaseLock(${fileToOperateOn}) section catch block called.`, error);
        lgu(`releaseLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerWithFunctionNameHierarchy}.\n`);
        if (debug) {
            fs.appendFileSync(
                `${logPath}/00_${currentTime()}_CatchError_${callerFunctionName}.txt`,
                `fn releaseLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerWithFunctionNameHierarchy}.\n`
            );
        }
        process.exit(1);
    }
}

/* #endregion */

/* #region  generate and get NonCatch, Catch error log levels 6/9 digit uniqueId */
/**
 *
 *                        ██                            ▀██▀ ▀██▀▀█▄
 *     ▄▄▄ ▄▄▄  ▄▄ ▄▄▄   ▄▄▄    ▄▄▄ ▄  ▄▄▄ ▄▄▄    ▄▄▄▄   ██   ██   ██
 *      ██  ██   ██  ██   ██  ▄▀   ██   ██  ██  ▄█▄▄▄██  ██   ██    ██
 *      ██  ██   ██  ██   ██  █▄   ██   ██  ██  ██       ██   ██    ██
 *      ▀█▄▄▀█▄ ▄██▄ ██▄ ▄██▄ ▀█▄▄▀██   ▀█▄▄▀█▄  ▀█▄▄▄▀ ▄██▄ ▄██▄▄▄█▀
 *                                 ██
 *                                ▀▀▀▀
 *
 */
// ONPROJECTFINISH: Check if all codes are present in log files which are generated because winston is found to not log in files just before process.exit(1)
/* #region getLastNonCatchErrorLogLevels9DigitUniqueId(), generateAndGetNonCatchErrorLogLevels9DigitUniqueId() : Begin */
function getLastNonCatchErrorLogLevels9DigitUniqueId() {
    const configContent = fs.readFileSync(getProjectConfigUniqueIdsFilePath(), 'utf8');
    const lastNonCatchErrorRegexString = `(    nonCatchErrorLogLevels9DigitUniqueId: ')(.*?)(',\\r\\n)`;
    const lastNonCatchErrorRegexExpression = new RegExp(lastNonCatchErrorRegexString, 'g');

    if (!lastNonCatchErrorRegexExpression.test(configContent)) {
        lgu('Unable to match regex for fn getLastNonCatchErrorLogLevels9DigitUniqueId()', new CallerHierarchyAndUniqueId('', ''));
        process.exit(1);
    }

    const match = configContent.match(lastNonCatchErrorRegexExpression);
    let lastNonCatchErrorLogLevels9DigitUniqueId = match[0].match(lastNonCatchErrorRegexString)[2];
    lastNonCatchErrorLogLevels9DigitUniqueId = lastNonCatchErrorLogLevels9DigitUniqueId !== '' ? lastNonCatchErrorLogLevels9DigitUniqueId : '0';
    return lastNonCatchErrorLogLevels9DigitUniqueId;
}

function generateAndGetNonCatchErrorLogLevels9DigitUniqueId() {
    const fileToOperateOn = getProjectConfigUniqueIdsFilePath();
    attainLock(fileToOperateOn, undefined, true);

    let nonCatchErrorCode;
    try {
        const currentNonCatchErrorLogLevels9DigitUniqueId = getLastNonCatchErrorLogLevels9DigitUniqueId();
        const configContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const currentNonCatchErrorRegexString = `(    nonCatchErrorLogLevels9DigitUniqueId: ')(.*?)(',\\r\\n)`;
        const currentNonCatchErrorRegexExpression = new RegExp(currentNonCatchErrorRegexString, 'g');

        if (!currentNonCatchErrorRegexExpression.test(configContent)) {
            lgu('Unable to match regex for fn generateAndGetNonCatchErrorLogLevels9DigitUniqueId()', new CallerHierarchyAndUniqueId('', ''));
            process.exit(1);
        }

        nonCatchErrorCode = parseInt(currentNonCatchErrorLogLevels9DigitUniqueId, 10);
        nonCatchErrorCode += 1;
        nonCatchErrorCode = zeroPad(nonCatchErrorCode, 9);
        const newConfigContent = configContent.replace(currentNonCatchErrorRegexExpression, `$1${nonCatchErrorCode}$3`);

        if (newConfigContent === undefined) {
            lgu(
                `Unable to set nonCatchErrorLogLevels9DigitUniqueId: '${nonCatchErrorCode}'. Serious issue, please contact developer.`,
                new CallerHierarchyAndUniqueId('', '')
            );
            releaseLock(fileToOperateOn, undefined, true);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        releaseLock(fileToOperateOn, undefined, true);
    } catch (err) {
        lgu(err, new CallerHierarchyAndUniqueId('', ''));
        process.exit(1);
    }
    return nonCatchErrorCode;
}
/* #endregion getLastNonCatchErrorLogLevels9DigitUniqueId(), generateAndGetNonCatchErrorLogLevels9DigitUniqueId() : End */

/* #region getLastCatchErrorLogLevels6DigitUniqueId(), generateAndGetCatchErrorLogLevels6DigitUniqueId() : Begin */
function getLastCatchErrorLogLevels6DigitUniqueId() {
    const configContent = fs.readFileSync(getProjectConfigUniqueIdsFilePath(), 'utf8');
    const lastCatchErrorRegexString = `(    catchErrorLogLevels6DigitUniqueId: ')(.*?)(',\\r\\n)`;
    const lastCatchErrorRegexExpression = new RegExp(lastCatchErrorRegexString, 'g');

    if (!lastCatchErrorRegexExpression.test(configContent)) {
        lgu('Unable to match regex for fn getLastCatchErrorLogLevels6DigitUniqueId()', new CallerHierarchyAndUniqueId('', ''));
        process.exit(1);
    }

    const match = configContent.match(lastCatchErrorRegexExpression);
    let lastLastCatchErrorLogLevels6DigitUniqueId = match[0].match(lastCatchErrorRegexString)[2];
    lastLastCatchErrorLogLevels6DigitUniqueId = lastLastCatchErrorLogLevels6DigitUniqueId !== '' ? lastLastCatchErrorLogLevels6DigitUniqueId : '0';
    return lastLastCatchErrorLogLevels6DigitUniqueId;
}

function generateAndGetCatchErrorLogLevels6DigitUniqueId() {
    const fileToOperateOn = getProjectConfigUniqueIdsFilePath();
    attainLock(fileToOperateOn, undefined, true);

    let catchErrorCode;
    try {
        const currentCatchErrorLogLevels6DigitUniqueId = getLastCatchErrorLogLevels6DigitUniqueId();
        const configContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const currentCatchErrorRegexString = `(    catchErrorLogLevels6DigitUniqueId: ')(.*?)(',\\r\\n)`;
        const currentCatchErrorRegexExpression = new RegExp(currentCatchErrorRegexString, 'g');

        if (!currentCatchErrorRegexExpression.test(configContent)) {
            lgu('Unable to match regex for fn generateAndGetCatchErrorLogLevels6DigitUniqueId()', new CallerHierarchyAndUniqueId('', ''));
            process.exit(1);
        }

        catchErrorCode = parseInt(currentCatchErrorLogLevels6DigitUniqueId, 10);
        catchErrorCode += 1;
        catchErrorCode = zeroPad(catchErrorCode, 6);
        const newConfigContent = configContent.replace(currentCatchErrorRegexExpression, `$1${catchErrorCode}$3`);

        if (newConfigContent === undefined) {
            lgu(
                `Unable to set catchErrorLogLevels6DigitUniqueId: '${catchErrorCode}'. Serious issue, please contact developer.`,
                new CallerHierarchyAndUniqueId('', '')
            );
            releaseLock(fileToOperateOn, undefined, true);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        releaseLock(fileToOperateOn, undefined, true);
    } catch (err) {
        lgu(err, new CallerHierarchyAndUniqueId('', ''));
        process.exit(1);
    }
    return catchErrorCode;
}
/* #endregion getLastCatchErrorLogLevels6DigitUniqueId(), generateAndGetCatchErrorLogLevels6DigitUniqueId() : End */
/* #endregion */

/* #region loggersupportive.js */
/**
 *     ▀██                                                  ▄▀█▄                             ▄    ██
 *      ██    ▄▄▄     ▄▄▄ ▄   ▄▄▄ ▄   ▄▄▄▄  ▄▄▄ ▄▄        ▄██▄   ▄▄▄ ▄▄▄  ▄▄ ▄▄▄     ▄▄▄▄  ▄██▄  ▄▄▄    ▄▄▄   ▄▄ ▄▄▄    ▄▄▄▄
 *      ██  ▄█  ▀█▄  ██ ██   ██ ██  ▄█▄▄▄██  ██▀ ▀▀        ██     ██  ██   ██  ██  ▄█   ▀▀  ██    ██  ▄█  ▀█▄  ██  ██  ██▄ ▀
 *      ██  ██   ██   █▀▀     █▀▀   ██       ██            ██     ██  ██   ██  ██  ██       ██    ██  ██   ██  ██  ██  ▄ ▀█▄▄
 *     ▄██▄  ▀█▄▄█▀  ▀████▄  ▀████▄  ▀█▄▄▄▀ ▄██▄          ▄██▄    ▀█▄▄▀█▄ ▄██▄ ██▄  ▀█▄▄▄▀  ▀█▄▀ ▄██▄  ▀█▄▄█▀ ▄██▄ ██▄ █▀▄▄█▀
 *                  ▄█▄▄▄▄▀ ▄█▄▄▄▄▀
 *
 */
function convertArgsToProperOrder(...args) {
    let message = '';
    let error;
    let textColor;
    let loggingPrefix = LoggingPrefix.true;
    let lineSeparator = LineSeparator.true;
    let callerHierarchyAndUniqueId;

    args.forEach((arg) => {
        // console.log(typeof arg);
        if (typeof arg === 'string') {
            message = arg;
        } else if (arg instanceof Error) {
            error = arg;
        } else if (arg instanceof Color) {
            textColor = arg;
        } else if (arg instanceof LoggingPrefix) {
            loggingPrefix = arg;
        } else if (arg instanceof LineSeparator) {
            lineSeparator = arg;
        } else if (arg instanceof CallerHierarchyAndUniqueId) {
            callerHierarchyAndUniqueId = arg;
        }
    });

    return [message, error, textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId];
}

/* #region lg_ functions */
/**
 * lgc: is for those errors which are catched by try, catch which are not anticipated, but are catched by try
 * catch blocks and should be handled.
 */
const lgc = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgu: is for those part of lines which should never be called, basically those sections of code
 * which are unreachable, if they are reached, there is some problem in the code.
 */
const lgu = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgs: is for errors which are generated at the application level mainly focused for developer purposes and debugging.
 */
const lgs = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportSevereFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.severe(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.severe(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lge: is for errors which are generated at the user level using the system, which a user should focus on.
 * Can be accompanied by a process.exit(1) also in some situations.
 */
const lge = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportErrorFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.error(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgh: is for errors which are hiccups generated at the user level, which a user can ignore.
 * which are assumed and accounted for already, as they are going to occur in almost every instance.
 */
const lgh = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportHiccupFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.hiccup(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.hiccup(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

/**
 * lgw: is for warnings which are generated at the user level using the system, which a user can focus on.
 * Even if it doesn't it will not disrupt the flow.
 */
const lgw = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportWarnFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.warn(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgi = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportInfoFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.info(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgv = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.verbose(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgd = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportDebugFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.debug(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.debug(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgt = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportTraceFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.trace(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.trace(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgb = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , textColor, loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportBillyFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.billy(...args, { callerHierarchy, uniqueId, textColor, loggingPrefix, lineSeparator });
    loggerFile.billy(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};
/* #endregion */

/* #region lg_f functions */
const lgcf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportCatcherrorFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lguf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportUnreachableFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.unreachable(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgsf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportSevereFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.severe(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgef = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportErrorFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lghf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportHiccupFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.hiccup(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgwf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportWarnFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgif = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportInfoFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgvf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportVerboseFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.verbose(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgdf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportDebugFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.debug(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgtf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportTraceFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.trace(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};

const lgbf = (...args) => {
    args = convertArgsToProperOrder(...args);
    const [, , , loggingPrefix, lineSeparator, callerHierarchyAndUniqueId] = args;
    args.splice(-4);
    addIndividualTransportBillyFileWinston();
    const callerHierarchy =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.callerHierarchy : getCallerHierarchyFormatted(...args);
    const uniqueId =
        callerHierarchyAndUniqueId !== undefined ? callerHierarchyAndUniqueId.uniqueId : generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.billy(...args, { callerHierarchy, uniqueId, loggingPrefix, lineSeparator });
};
/* #endregion */
/* #endregion */

export {
    attainLock,
    releaseLock,
    getCallerDetails,
    getCallerDetailsList,
    getCallerFormatted,
    getCallerHierarchyFormatted,
    getCallerHierarchyWithFunctionNameFormatted,
    lgc,
    lgu,
    lgs,
    lge,
    lgh,
    lgw,
    lgi,
    lgv,
    lgd,
    lgt,
    lgb,
    lgcf,
    lguf,
    lgsf,
    lgef,
    lghf,
    lgwf,
    lgif,
    lgvf,
    lgdf,
    lgtf,
    lgbf,
};
