import path from 'path';
import date from 'date-and-time';
import fsExtra from 'fs-extra';
import { checkSync, lockSync, unlockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { msleep } from './sleep.js';
/* eslint-enable import/extensions */

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');

function attainLock(fileToOperateOn, takeBackup = false, debug = false) {
    const currentTime = date.format(new Date(), 'HHmmssSSS');
    const randomNumer = Math.floor(Math.random() * (999 - 100 + 1) + 100);
    if (takeBackup) {
        const fromPath = fileToOperateOn;
        const toPath = `${config.lockingBackupsZonePath}\\${todaysDate}\\${path.basename(fileToOperateOn)}_${currentTime}(${randomNumer})`;
        try {
            const results = fsExtra.copySync(fromPath, toPath, { overwrite: false, errorOnExist: true });
            debug
                ? console.log(
                      `${'Successfully copied  '}${results}${' files from the \n\tSource Directory: '}${fromPath}\n\t\t\tTo \n\tDestination Directory: ${toPath}`
                  )
                : '';
        } catch (error) {
            console.log(`${'Unable to create backup from file \n\tSource Directory: '}${fromPath} \n\t\t\tTo \n\tDestination Directory: ${toPath}`);
            // throw error;
            process.exit(1);
        }
    }
    for (let lockTryIndex = 0; lockTryIndex <= 30; lockTryIndex++) {
        if (lockTryIndex === 30) {
            console.log(`Unable to get the lock`);
            process.exit(1);
        }
        try {
            const checkLock = checkSync(fileToOperateOn);
            if (checkLock) {
                msleep(50 + lockTryIndex * 3, true);
                // await waitForMilliSeconds(50 + lockTryIndex * 3);
                // eslint-disable-next-line no-continue
                continue;
            }
            lockSync(fileToOperateOn);
            break;
        } catch (error) {
            console.log(`${error.message}`);
            console.log(`attainLock(${fileToOperateOn}): This piece of code should be unreachable.`);
            process.exit(1);
        }
    }
}

function releaseLock(fileToOperateOn) {
    // console.log(`releasing lock here: ${fileToOperateOn}`);
    unlockSync(fileToOperateOn);
}

export { attainLock, releaseLock };
