import fs from 'fs';
import path from 'path';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import {
    currentTime,
    instanceRunDateFormatted,
    instanceRunDateTimeSeparated,
    instanceRunDateTimeWOMSSeparated,
    instanceRunTimeWOMS,
} from './datetime.js';
import { getProjectLogsDirPath } from './projectpaths.js';
/* eslint-enable import/extensions */

// TODO: Check why debug here is set to true.
const debug = true;
/**
 *
 * Acquire a lock on `instanceRunLogFilePrefix` (without any extenstion) so as to avoid deletion
 * of logs files created by same prefix by the current instance itself.
 *
 */
const instanceRunLogFilePrefix = path.join(getProjectLogsDirPath(), instanceRunDateFormatted, instanceRunDateTimeSeparated);
const instanceRunLogFilePrefixDir = path.dirname(instanceRunLogFilePrefix);
if (!fs.existsSync(instanceRunLogFilePrefixDir)) {
    fs.mkdirSync(instanceRunLogFilePrefixDir, { recursive: true });
}
if (!fs.existsSync(instanceRunLogFilePrefix)) {
    fs.writeFileSync(instanceRunLogFilePrefix, '', (err) => {});
}
if (!checkSync(instanceRunLogFilePrefix, { stale: 15000 })) {
    // Stale for 12 hours
    /**
     * This code is inner contents copied from `attainLock` function as
     * calling `attainLock()` here directly creates a cyclic dependency problem.
     */
    // ONPROJECTFINISH: Copy attainLock contents again, to incorporate the final changes in attainLock function if any.
    // ONPROJECTFINISH: Also switching debug to false, and switching debug from config file.

    /* #region */
    try {
        lockSync(instanceRunLogFilePrefix, { stale: 15000 });
    } catch (error) {
        if (error.message.trim() !== 'Lock file is already being held') {
            throw error;
        }
    }
    if (debug) {
        const logPath = path.join(
            getProjectLogsDirPath(),
            'lockslog',
            instanceRunDateFormatted,
            instanceRunTimeWOMS,
            `logs{Slash}${instanceRunDateFormatted}{Slash}${path.basename(instanceRunLogFilePrefix)}`
        );
        if (!fs.existsSync(logPath)) {
            fs.mkdirSync(logPath, { recursive: true });
        }
        fs.appendFileSync(
            `${logPath}/${currentTime()}_AttainedLock_loggervariables.js.txt`,
            `Got A Lock On '${instanceRunLogFilePrefix}', caller: loggervariables.js.\n`
        );
    }
    /* #endregion */
}

// eslint-disable-next-line import/prefer-default-export
export { instanceRunLogFilePrefix };
