import fs from 'fs';
import path from 'path';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { currentTimeFormatted, instanceRunDateFormatted, instanceRunDateTimeFormatted, instanceRunTimeFormatted } from './datetime.js';
/* eslint-enable import/extensions */

const debug = true;
/**
 *
 * Acquire a lock on `instanceRunLogFilePrefix` (without any extenstion) so as to avoid deletion
 * of logs files created by same prefix by the current instance itself.
 *
 */
const instanceRunLogFilePrefix = `.\\logs\\${instanceRunDateFormatted}\\${instanceRunDateTimeFormatted}`;
if (!fs.existsSync(instanceRunLogFilePrefix)) {
    fs.writeFile(instanceRunLogFilePrefix, '', (err) => {});
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
        const logPath = `./logs/lockslog/${instanceRunDateFormatted}/${instanceRunTimeFormatted}/${path.basename(instanceRunLogFilePrefix)}`;
        fs.appendFileSync(
            `${logPath}/${currentTimeFormatted()}_AttainedLock_loggervariables.js.txt`,
            `Got A Lock On '${instanceRunLogFilePrefix}', caller: loggervariables.js.\n`
        );
    }
    /* #endregion */
}

// eslint-disable-next-line import/prefer-default-export
export { instanceRunLogFilePrefix };
