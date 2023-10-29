import path from 'path';
import fs from 'fs';
import chalk from 'chalk';
import { checkSync, lockSync, unlockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { msleep } from './sleep.js';
import { instanceRunDateFormatted, instanceRunTime, currentTime } from './datetime.js';
import { lgccyclicdependency } from './loggercyclicdependency.js';
import { getCallerDetails } from './callerdetails.js';
/* eslint-enable import/extensions */

// Attemp to attainLock, retrying multiple times in a duration of 5 to 10 mins, before timing out
function attainLock(fileToOperateOn, stale = 300000, debug = false) {
    const errorToGetCaller = new Error();
    const { functionName: callerFunctionName } = getCallerDetails([errorToGetCaller]);
    const logPath = `./logs/lockslog/${instanceRunDateFormatted}/${instanceRunTime}/${path.basename(fileToOperateOn)}`;
    try {
        fs.mkdirSync(logPath, { recursive: true });
        for (let lockTryIndex = 0; lockTryIndex <= 12000; lockTryIndex++) {
            if (lockTryIndex === 12000) {
                lgccyclicdependency(`attainLock(${fileToOperateOn}): Unable to get the lock.`);
                if (debug) {
                    fs.appendFileSync(
                        `${logPath}/00_${currentTime()}_UNABLE_TO_GET_A_LOCK-caller_${callerFunctionName}.txt`,
                        `Unable to get the lock on '${fileToOperateOn}', caller: ${callerFunctionName}.\n`
                    );
                }
                process.exit(1);
            } else if (lockTryIndex !== 0 && lockTryIndex % 1500 === 0) {
                lgccyclicdependency(`Trying to get a lock on: \n${fileToOperateOn}    ......`);
            } else if (lockTryIndex !== 0 && lockTryIndex % 300 === 0) {
                process.stdout.write(chalk.cyan(` ■`));
            }
            if (checkSync(fileToOperateOn, { stale: stale })) {
                if (debug) {
                    fs.appendFileSync(
                        `${logPath}/${currentTime()}_.....LockAlready-caller_${callerFunctionName}.txt`,
                        `....... Lock on '${fileToOperateOn}' is already with someone, Waiting and trying again, caller: ${callerFunctionName}.\n`
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
                    `Got A Lock On '${fileToOperateOn}', caller: ${callerFunctionName}.\n`
                );
            }
            break;
        }
    } catch (error) {
        lgccyclicdependency(`attainLock(${fileToOperateOn}) section catch block called.`, error);
        console.log(error.message);
        console.log(`attainLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`);
        if (debug) {
            fs.appendFileSync(
                `${logPath}/00_${currentTime()}_CatchError_${callerFunctionName}.txt`,
                `fn attainLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerFunctionName}.\n`
            );
        }
        process.exit(1);
    }
}

function releaseLock(fileToOperateOn, stale = 300000, debug = false) {
    const errorToGetCaller = new Error();
    const logPath = `./logs/lockslog/${instanceRunDateFormatted}/${instanceRunTime}/${path.basename(fileToOperateOn)}`;
    let callerFunctionName = '';
    try {
        ({ functionName: callerFunctionName } = getCallerDetails([errorToGetCaller]));
        fs.mkdirSync(logPath, { recursive: true });
        if (checkSync(fileToOperateOn, { stale: stale })) {
            const filename = `${logPath}/${currentTime()}_ReleasedLock_${callerFunctionName}.txt`;
            unlockSync(fileToOperateOn);
            if (debug) {
                fs.appendFileSync(filename, `Released A Lock On '${fileToOperateOn}', caller: ${callerFunctionName}.\n`);
            }
        }
    } catch (error) {
        lgccyclicdependency(`releaseLock(${fileToOperateOn}) section catch block called.`, error);
        console.log(error.message);
        console.log(`releaseLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`);
        if (debug) {
            fs.appendFileSync(
                `${logPath}/00_${currentTime()}_CatchError_${callerFunctionName}.txt`,
                `fn releaseLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerFunctionName}.\n`
            );
        }
        process.exit(1);
    }
}

export { attainLock, releaseLock };
