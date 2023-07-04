import path from 'path';
import date from 'date-and-time';
import fs from 'fs';
import { checkSync, lockSync, unlockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { msleep } from './sleep.js';
/* eslint-enable import/extensions */

// Attemp to attainLock, retrying multiple times in a duration of 30 to 60 seconds, before timing out
function attainLock(fileToOperateOn, writeToFile = false, debug = false) {
    const errorToGetCaller = new Error();
    const callerFunctionName = errorToGetCaller.stack.split('\n')[2].trim().split(' ')[1];
    for (let lockTryIndex = 0; lockTryIndex <= 1200; lockTryIndex++) {
        if (lockTryIndex === 1200) {
            console.log(`Unable to get the lock`);
            if (writeToFile) {
                fs.appendFileSync(
                    `./logs/lockFile_${path.basename(fileToOperateOn)}.txt`,
                    `Unable to get the lock on '${fileToOperateOn}', caller: ${callerFunctionName}.\n`
                );
            }
            process.exit(1);
        }
        try {
            const checkLock = checkSync(fileToOperateOn);
            if (checkLock) {
                if (writeToFile) {
                    fs.appendFileSync(
                        `./logs/lockFile_${path.basename(fileToOperateOn)}.txt`,
                        `....... Lock on '${fileToOperateOn}' is already with someone, Waiting and trying again, caller: ${callerFunctionName}.\n`
                    );
                }
                // msleep(50 + lockTryIndex * 3, true); // why true is mentioned here
                const radomNumberBetween25and50 = Math.floor(Math.random() * (50 - 25 + 1)) + 25;
                msleep(radomNumberBetween25and50);
                // await waitForMilliSeconds(50 + lockTryIndex * 3);
                // eslint-disable-next-line no-continue
                continue;
            }
            lockSync(fileToOperateOn);
            if (writeToFile) {
                fs.appendFileSync(
                    `./logs/lockFile_${path.basename(fileToOperateOn)}.txt`,
                    `Got A Lock On '${fileToOperateOn}', caller: ${callerFunctionName}.\n`
                );
            }
            break;
        } catch (error) {
            console.log(`${error.message}`);
            console.log(`attainLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`);
            if (writeToFile) {
                fs.appendFileSync(
                    `./logs/lockFile_${path.basename(fileToOperateOn)}.txt`,
                    `attainLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`
                );
            }
            process.exit(1);
        }
    }
}

function releaseLock(fileToOperateOn, writeToFile = false) {
    const errorToGetCaller = new Error();
    const callerFunctionName = errorToGetCaller.stack.split('\n')[2].trim().split(' ')[1];
    try {
        // console.log(`releasing lock here: ${fileToOperateOn}`);
        const checkLock = checkSync(fileToOperateOn);
        if (checkLock) {
            unlockSync(fileToOperateOn);
            if (writeToFile) {
                fs.appendFileSync(
                    `./logs/lockFile_${path.basename(fileToOperateOn)}.txt`,
                    `Released A Lock On '${fileToOperateOn}', caller: ${callerFunctionName}.\n`
                );
            }
        }
    } catch (error) {
        console.log(`${error.message}`);
        console.log(`releaseLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`);
        if (writeToFile) {
            fs.appendFileSync(
                `./logs/lockFile_${path.basename(fileToOperateOn)}.txt`,
                `releaseLock(${fileToOperateOn}): This piece of code should be unreachable, caller: ${callerFunctionName}.\n`
            );
        }
        process.exit(1);
    }
}

export { attainLock, releaseLock };
