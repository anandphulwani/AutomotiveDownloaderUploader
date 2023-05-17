import date from 'date-and-time';
import { copySync, moveSync } from 'fs-extra';
import { checkSync, lockSync, unlockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { msleep } from './sleep.js';
/* eslint-disable import/no-cycle */
import { lgc } from './loggersupportive.js';
import { copyDirOrFile } from './filesystem.js';
/* eslint-enable import/no-cycle */
/* eslint-enable import/extensions */

const todaysDate = date.format(new Date(), 'YYYY-MM-DD');
const currentTime = date.format(new Date(), 'HHmmss');

function attainLock(fileToOperateOn, takeBackup = false, debug = false) {
    if (takeBackup) {
        copyDirOrFile(fileToOperateOn, `${config.lockingBackupsZonePath}\\${todaysDate}\\${fileToOperateOn}_${currentTime}`);
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
            console.log(`attainLock(fileToOperateOn): This piece of code should be unreachable.`);
        }
    }
}

function releaseLock(fileToOperateOn) {
    console.log('releasing lock here');
    unlockSync(fileToOperateOn);
}

export { attainLock, releaseLock };
