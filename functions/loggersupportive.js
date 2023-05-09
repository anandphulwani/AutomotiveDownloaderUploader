import chalk from 'chalk';
import fs from 'fs';
import path from 'path';
import { lockSync, unlockSync, checkSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { zeroPad } from './stringformatting.js';
import { msleep, sleep, waitForMilliSeconds, waitForSeconds } from './sleep.js';
import {
    todaysDateForLogger,
    todaysDateWithTimeForLogger,
    loggerFile,
    loggerConsole,
    addIndividualTransportUnreachableFileWinston,
    addIndividualTransportCatcherrorFileWinston,
    addIndividualTransportErrorFileWinston,
    addIndividualTransportWarnFileWinston,
    addIndividualTransportInfoFileWinston,
} from './logger.js';
/* eslint-enable import/extensions */

// ONPROJECTFINISH: Check if all codes are present in log files which are generated because winston is found to not log in files just before process.exit(1)
/* #region getLastNonCatchErrorLogLevels9DigitUniqueId(), generateAndGetNonCatchErrorLogLevels9DigitUniqueId() : Begin */
function getLastNonCatchErrorLogLevels9DigitUniqueId() {
    const configContent = fs.readFileSync('.\\configs\\config.js', 'utf8');
    const lastNonCatchErrorRegexString = `(    nonCatchErrorLogLevels9DigitUniqueId: ')(.*?)(',\\r\\n)`;
    const lastNonCatchErrorRegexExpression = new RegExp(lastNonCatchErrorRegexString, 'g');

    const match = configContent.match(lastNonCatchErrorRegexExpression);
    let lastNonCatchErrorLogLevels9DigitUniqueId = match[0].match(lastNonCatchErrorRegexString)[2];
    lastNonCatchErrorLogLevels9DigitUniqueId = lastNonCatchErrorLogLevels9DigitUniqueId !== '' ? lastNonCatchErrorLogLevels9DigitUniqueId : '0';
    return lastNonCatchErrorLogLevels9DigitUniqueId;
}

function generateAndGetNonCatchErrorLogLevels9DigitUniqueId() {
    const fileToOperateOn = '.\\configs\\config.js';
    for (let lockTryIndex = 0; lockTryIndex <= 30; lockTryIndex++) {
        if (lockTryIndex === 5) {
            console.log(`Unable to get the lock`);
            process.exit(1);
        }
        try {
            const checkLock = checkSync(fileToOperateOn);
            if (checkLock) {
                msleep(50 + lockTryIndex * 3);
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

    let nonCatchError;
    try {
        const currentNonCatchErrorLogLevels9DigitUniqueId = getLastNonCatchErrorLogLevels9DigitUniqueId();
        const ConfigContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const currentNonCatchErrorRegexString = `(    nonCatchErrorLogLevels9DigitUniqueId: ')(.*?)(',\\r\\n)`;
        const currentNonCatchErrorRegexExpression = new RegExp(currentNonCatchErrorRegexString, 'g');

        nonCatchError = parseInt(currentNonCatchErrorLogLevels9DigitUniqueId, 10);
        nonCatchError += 1;
        nonCatchError = zeroPad(nonCatchError, 9);
        const newConfigContent = ConfigContent.replace(currentNonCatchErrorRegexExpression, `$1${nonCatchError}$3`);

        if (newConfigContent === undefined) {
            console.log(
                chalk.white.bgRed.bold(
                    `Unable to set nonCatchErrorLogLevels9DigitUniqueId: '${nonCatchError}'. Serious issue, please contact developer.`
                )
            );
            unlockSync(fileToOperateOn);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        unlockSync(fileToOperateOn);
    } catch (err) {
        console.log(`${err.message}`);
        process.exit(1);
    }
    return nonCatchError;
}
/* #endregion getLastNonCatchErrorLogLevels9DigitUniqueId(), generateAndGetNonCatchErrorLogLevels9DigitUniqueId() : End */

/* #region getLastCatchErrorLogLevels6DigitUniqueId(), generateAndGetCatchErrorLogLevels6DigitUniqueId() : Begin */
function getLastCatchErrorLogLevels6DigitUniqueId() {
    const configContent = fs.readFileSync('.\\configs\\config.js', 'utf8');
    const lastCatchErrorRegexString = `(    catchErrorLogLevels6DigitUniqueId: ')(.*?)(',\\r\\n)`;
    const lastCatchErrorRegexExpression = new RegExp(lastCatchErrorRegexString, 'g');

    const match = configContent.match(lastCatchErrorRegexExpression);
    let lastLastCatchErrorLogLevels6DigitUniqueId = match[0].match(lastCatchErrorRegexString)[2];
    lastLastCatchErrorLogLevels6DigitUniqueId = lastLastCatchErrorLogLevels6DigitUniqueId !== '' ? lastLastCatchErrorLogLevels6DigitUniqueId : '0';
    return lastLastCatchErrorLogLevels6DigitUniqueId;
}

function generateAndGetCatchErrorLogLevels6DigitUniqueId() {
    const fileToOperateOn = '.\\configs\\config.js';
    for (let lockTryIndex = 0; lockTryIndex <= 30; lockTryIndex++) {
        if (lockTryIndex === 5) {
            process.exit(1);
        }
        try {
            const checkLock = checkSync(fileToOperateOn);
            if (checkLock) {
                msleep(50 + lockTryIndex * 3, true);
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

    let catchError;
    try {
        const currentCatchErrorLogLevels6DigitUniqueId = getLastCatchErrorLogLevels6DigitUniqueId();
        const configContent = fs.readFileSync(fileToOperateOn, 'utf8');

        const currentCatchErrorRegexString = `(    catchErrorLogLevels6DigitUniqueId: ')(.*?)(',\\r\\n)`;
        const currentCatchErrorRegexExpression = new RegExp(currentCatchErrorRegexString, 'g');

        catchError = parseInt(currentCatchErrorLogLevels6DigitUniqueId, 10);
        catchError += 1;
        catchError = zeroPad(catchError, 6);
        const newConfigContent = configContent.replace(currentCatchErrorRegexExpression, `$1${catchError}$3`);

        if (newConfigContent === undefined) {
            console.log(
                chalk.white.bgRed.bold(`Unable to set catchErrorLogLevels6DigitUniqueId: '${catchError}'. Serious issue, please contact developer.`)
            );
            unlockSync(fileToOperateOn);
            process.exit(1);
        }
        fs.writeFileSync(fileToOperateOn, newConfigContent, 'utf8');
        unlockSync(fileToOperateOn);
    } catch (err) {
        console.log(`${err.message}`);
        process.exit(1);
    }
    return catchError;
}
/* #endregion getLastCatchErrorLogLevels6DigitUniqueId(), generateAndGetCatchErrorLogLevels6DigitUniqueId() : End */

fs.writeFile(`.\\logs\\${todaysDateForLogger}\\${todaysDateWithTimeForLogger}`, '', (err) => {});
const fileToOperateOn = `.\\logs\\${todaysDateForLogger}\\${todaysDateWithTimeForLogger}`;
for (let lockTryIndex = 0; lockTryIndex <= 30; lockTryIndex++) {
    if (lockTryIndex === 30) {
        console.log(`Unable to get the lock`);
        process.exit(1);
    }
    const checkLock = checkSync(fileToOperateOn);
    if (checkLock) {
        await waitForMilliSeconds(50 + lockTryIndex * 3);
        // eslint-disable-next-line no-continue
        continue;
    }
    lockSync(fileToOperateOn);
    break;
}

// eslint-disable-next-line no-restricted-syntax
for (const dateDir of fs.readdirSync('.\\logs\\')) {
    const entryPath = path.join('.\\logs\\', dateDir);
    if (fs.statSync(entryPath).isDirectory()) {
        const dateDirFilesAndFolders = fs.readdirSync(entryPath);
        let lockDirectories = dateDirFilesAndFolders.filter((filesAndFolders) => {
            const filePath = path.join(entryPath, filesAndFolders);
            return fs.statSync(filePath).isDirectory() && filesAndFolders.endsWith('.lock');
        });
        lockDirectories = lockDirectories.map((dir) => dir.replace(/\.lock$/, ''));
        // console.log(lockDirectories);

        // Filter only the files that are not in lockDirectories
        const nonLockFiles = dateDirFilesAndFolders.filter((file) => {
            const filePath = path.join(entryPath, file);
            const statSync = fs.statSync(filePath);
            const isDirectory = statSync.isDirectory();
            const isNotLocked = !lockDirectories.some((lockDir) => file.startsWith(lockDir));
            const isSizeZero = statSync.size === 0;
            return !isDirectory && isNotLocked && isSizeZero;
        });
        // console.log(nonLockFiles);

        // eslint-disable-next-line no-restricted-syntax
        for (const file of nonLockFiles) {
            const filePath = path.join(entryPath, file);
            // Uncomment the following line to delete the file
            fs.unlinkSync(filePath);
        }
    }
}

const getCallerDetails = (...args) => {
    let stackTrace;
    let filename;
    let lineNumber;
    // eslint-disable-next-line no-restricted-syntax
    for (const arg of args) {
        if (arg instanceof Error) {
            stackTrace = arg.stack.split('\n');
            const stackDetailsCatchLine = stackTrace[1].match(/at (.+)\/(.+?):(\d+):(\d+)/);
            [, , filename, lineNumber] = stackDetailsCatchLine;
        }
    }
    if (filename === undefined && lineNumber === undefined) {
        stackTrace = new Error().stack.split('\n');
        if (stackTrace[0].startsWith('Error')) {
            stackTrace.shift();
        }
        if (stackTrace[0].trim().startsWith('at getCallerDetails')) {
            stackTrace.shift();
            stackTrace.shift();
        }
        const stackDetailsCatchLine = stackTrace[0].match(/at (.+)\/(.+?):(\d+):(\d+)/);
        if (stackDetailsCatchLine) {
            let [, fullFilePath] = stackDetailsCatchLine;
            [, , filename, lineNumber] = stackDetailsCatchLine;
            fullFilePath += `/${filename}`;
            if (stackTrace[1] !== undefined) {
                const stackDetailsErrorLineInTry = stackTrace[1].match(/at (.+)\/(.+?):(\d+):(\d+)/);
                if (stackDetailsErrorLineInTry) {
                    let [, fullFilePath2ndLine] = stackDetailsErrorLineInTry;
                    const [, , filename2ndLine, lineNumber2ndLine] = stackDetailsErrorLineInTry;
                    fullFilePath2ndLine += `/${filename2ndLine}`;
                    if (fullFilePath === fullFilePath2ndLine) {
                        lineNumber += `,${lineNumber2ndLine}`;
                    }
                }
            }
        } else {
            filename = '';
            lineNumber = '';
        }
    }
    return {
        filename: filename,
        lineNumber: lineNumber,
    };
};

const lgu = (...args) => {
    addIndividualTransportUnreachableFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.unreachable(...args, { filename, lineNumber, uniqueId });
    loggerFile.unreachable(...args, { filename, lineNumber, uniqueId });
};

const lgc = (...args) => {
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerConsole.catcherror(...args, { filename, lineNumber, uniqueId });
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId });
};

const lge = (...args) => {
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.error(...args, { filename, lineNumber, uniqueId });
    loggerFile.error(...args, { filename, lineNumber, uniqueId });
};

const lgw = (...args) => {
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.warn(...args, { filename, lineNumber, uniqueId });
    loggerFile.warn(...args, { filename, lineNumber, uniqueId });
};

const lgi = (...args) => {
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerConsole.info(...args, { filename, lineNumber, uniqueId });
    loggerFile.info(...args, { filename, lineNumber, uniqueId });
};

const lgv = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.verbose(message);
    loggerFile.verbose(message);
};

const lgd = (...args) => {
    const { filename, lineNumber } = getCallerDetails();
    const message = addFileInfo(...args, filename, lineNumber);
    loggerConsole.debug(message);
    loggerFile.debug(message);
};

const lgs = (...args) => {

const lgcf = (...args) => {
    addIndividualTransportCatcherrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetCatchErrorLogLevels6DigitUniqueId();
    loggerFile.catcherror(...args, { filename, lineNumber, uniqueId });
};

const lgef = (...args) => {
    addIndividualTransportErrorFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.error(...args, { filename, lineNumber, uniqueId });
};

const lgwf = (...args) => {
    addIndividualTransportWarnFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.warn(...args, { filename, lineNumber, uniqueId });
};

const lgif = (...args) => {
    addIndividualTransportInfoFileWinston();
    const { filename, lineNumber } = getCallerDetails(...args);
    const uniqueId = generateAndGetNonCatchErrorLogLevels9DigitUniqueId();
    loggerFile.info(...args, { filename, lineNumber, uniqueId });
};

// eslint-disable-next-line import/prefer-default-export
export { lgc, lgu, lge, lgw, lgi, lgv, lgd, lgs, lgcf, lgef, lgwf, lgif };
