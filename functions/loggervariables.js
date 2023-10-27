import fs from 'fs';
import path from 'path';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { currentTime, instanceRunDateFormatted, instanceRunDateTimeSeparated, instanceRunTime } from './datetime.js';
/* eslint-enable import/extensions */

const debug = true;
/**
 *
 * Acquire a lock on `instanceRunLogFilePrefix` (without any extenstion) so as to avoid deletion
 * of logs files created by same prefix by the current instance itself.
 *
 */
const instanceRunLogFilePrefix = `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeSeparated}`;
const instanceRunLogFilePrefixDir = path.dirname(instanceRunLogFilePrefix);
if (!fs.existsSync(instanceRunLogFilePrefixDir)) {
    fs.mkdirSync(instanceRunLogFilePrefixDir, { recursive: true });
}
if (!fs.existsSync(instanceRunLogFilePrefix)) {
    fs.writeFileSync(instanceRunLogFilePrefix, '', (err) => {});
}
if (!checkSync(instanceRunLogFilePrefix, { stale: 43200000 })) {
    // Stale for 12 hours
    /**
     * This code is copied from attainLock as calling it here
     * creates a cyclic dependency problem.
     */

    /* #region */
    try {
        lockSync(instanceRunLogFilePrefix, { stale: 43200000 });
    } catch (error) {
        if (error.message.trim() !== 'Lock file is already being held') {
            throw error;
        }
    }
    if (debug) {
        const logPath = `./logs/lockslog/${instanceRunDateFormatted}/${instanceRunTime}/${path.basename(instanceRunLogFilePrefix)}`;
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
