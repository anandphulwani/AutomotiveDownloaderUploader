import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { checkSync, lockSync, unlockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { msleep } from './sleep.js';
import { instanceRunDateFormatted, instanceRunTimeWOMS, currentTime } from './datetime.js';
import { lgccyclicdependency, lgwcyclicdependency } from './loggercyclicdependency.js';
import { getCallerDetails, getCallerDetailsList, getCallerHierarchyWithFunctionNameFormatted } from './callerdetails.js';
import { getProjectLogsDirPath } from './projectpaths.js';
/* eslint-enable import/extensions */

// Attemp to attainLock, retrying multiple times in a duration of 5 to 10 mins, before timing out
function attainLock(fileToOperateOn, stale = 5000, debug = false) {
    const callerDetailsList = getCallerDetailsList(new Error().stack).slice(1);
    const callerWithFunctionNameHierarchy = getCallerHierarchyWithFunctionNameFormatted(callerDetailsList);
    const callerFunctionName = getCallerDetails(callerDetailsList).functionName;
    const logPath = path.join(getProjectLogsDirPath(), 'lockslog', instanceRunDateFormatted, instanceRunTimeWOMS, path.basename(fileToOperateOn));
    try {
        fs.mkdirSync(logPath, { recursive: true });
        for (let lockTryIndex = 0; lockTryIndex <= 12000; lockTryIndex++) {
            if (lockTryIndex === 12000) {
                lgccyclicdependency(`attainLock(${fileToOperateOn}): Unable to get the lock.`);
                if (debug) {
                    fs.appendFileSync(
                        `${logPath}/00_${currentTime()}_UNABLE_TO_GET_A_LOCK-caller_${callerFunctionName}.txt`,
                        `Unable to get the lock on '${fileToOperateOn}', caller: ${callerWithFunctionNameHierarchy}.\n`
                    );
                }
                process.exit(1);
            } else if (lockTryIndex !== 0 && lockTryIndex % 1500 === 0) {
                lgwcyclicdependency(`Trying to get a lock on: \n${fileToOperateOn}    ......`);
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
        lgccyclicdependency(`attainLock(${fileToOperateOn}) section catch block called.`, error);
        lgccyclicdependency(
            `attainLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerWithFunctionNameHierarchy}.\n`
        );
        if (debug) {
            fs.appendFileSync(
                `${logPath}/00_${currentTime()}_CatchError_${callerFunctionName}.txt`,
                `fn attainLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerWithFunctionNameHierarchy}.\n`
            );
        }
        process.exit(1);
    }
}

function releaseLock(fileToOperateOn, stale = 5000, debug = false) {
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
        lgccyclicdependency(`releaseLock(${fileToOperateOn}) section catch block called.`, error);
        lgccyclicdependency(
            `releaseLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerWithFunctionNameHierarchy}.\n`
        );
        if (debug) {
            fs.appendFileSync(
                `${logPath}/00_${currentTime()}_CatchError_${callerFunctionName}.txt`,
                `fn releaseLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerWithFunctionNameHierarchy}.\n`
            );
        }
        process.exit(1);
    }
}

export { attainLock, releaseLock };
