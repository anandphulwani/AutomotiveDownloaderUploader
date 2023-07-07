import path from 'path';
import fs from 'fs';
import { checkSync, lockSync, unlockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { msleep } from './sleep.js';
import { instanceRunDateFormatted, instanceRunTimeFormatted, currentTimeFormatted } from './datetime.js';
import { lgccyclicdependency } from './loggercyclicdependency.js';
/* eslint-enable import/extensions */

// Attemp to attainLock, retrying multiple times in a duration of 30 to 60 seconds, before timing out
function attainLock(fileToOperateOn, writeToFile = false, debug = false) {
    const errorToGetCaller = new Error();
    const callerFunctionName = errorToGetCaller.stack.split('\n')[2].trim().split(' ')[1];
    const logPath = `./logs/lockslog/${instanceRunDateFormatted}/${instanceRunTimeFormatted}/${path.basename(fileToOperateOn)}`;
    try {
        fs.mkdirSync(logPath, { recursive: true });
        for (let lockTryIndex = 0; lockTryIndex <= 12000; lockTryIndex++) {
            if (lockTryIndex === 12000) {
                console.log(`Unable to get the lock`);
                if (writeToFile) {
                    fs.appendFileSync(
                        `${logPath}/00_${currentTimeFormatted}_UNABLE_TO_GET_A_LOCK-caller_${callerFunctionName}.txt`,
                        `Unable to get the lock on '${fileToOperateOn}', caller: ${callerFunctionName}.\n`
                    );
                }
                process.exit(1);
            }
            if (checkSync(fileToOperateOn)) {
                if (writeToFile) {
                    fs.appendFileSync(
                        `${logPath}/${currentTimeFormatted}_.....LockAlready-caller_${callerFunctionName}.txt`,
                        `....... Lock on '${fileToOperateOn}' is already with someone, Waiting and trying again, caller: ${callerFunctionName}.\n`
                    );
                }
                const radomNumberBetween25and50 = Math.floor(Math.random() * (50 - 25 + 1)) + 25;
                msleep(radomNumberBetween25and50);
                // eslint-disable-next-line no-continue
                continue;
            }
            lockSync(fileToOperateOn);
            if (writeToFile) {
                fs.appendFileSync(
                    `${logPath}/${currentTimeFormatted}_AttainedLock_${callerFunctionName}.txt`,
                    `Got A Lock On '${fileToOperateOn}', caller: ${callerFunctionName}.\n`
                );
            }
            break;
        }
    } catch (error) {
        lgccyclicdependency(`attainLock(${fileToOperateOn}) section catch block called.`, error);
        console.log(error.message);
        console.log(`attainLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`);
        if (writeToFile) {
            fs.appendFileSync(
                `${logPath}/00_${currentTimeFormatted}_CatchError_${callerFunctionName}.txt`,
                `fn attainLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerFunctionName}.\n`
            );
        }
        process.exit(1);
    }
}

function releaseLock(fileToOperateOn, writeToFile = false) {
    const errorToGetCaller = new Error();
    const logPath = `./logs/lockslog/${instanceRunDateFormatted}/${instanceRunTimeFormatted}/${path.basename(fileToOperateOn)}`;
    let callerFunctionName = '';
    try {
        [, callerFunctionName] = errorToGetCaller.stack.split('\n')[2].trim().split(' ');
        fs.mkdirSync(logPath, { recursive: true });
        if (checkSync(fileToOperateOn)) {
            const filename = `${logPath}/${currentTimeFormatted}_ReleasedLock_${callerFunctionName}.txt`;
            unlockSync(fileToOperateOn);
            if (writeToFile) {
                fs.appendFileSync(filename, `Released A Lock On '${fileToOperateOn}', caller: ${callerFunctionName}.\n`);
            }
        }
    } catch (error) {
        lgccyclicdependency(`releaseLock(${fileToOperateOn}) section catch block called.`, error);
        console.log(error.message);
        console.log(`releaseLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`);
        if (writeToFile) {
            fs.appendFileSync(
                `${logPath}/00_${currentTimeFormatted}_CatchError_${callerFunctionName}.txt`,
                `fn releaseLock(${fileToOperateOn}): ${error.message}\n\n caller: ${callerFunctionName}.\n`
            );
        }
        process.exit(1);
    }
}

export { attainLock, releaseLock };
