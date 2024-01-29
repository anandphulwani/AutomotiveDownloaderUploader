import { spawn } from 'child_process';
import { checkSync, lockSync } from 'proper-lockfile';

/* eslint-disable import/extensions */
import { config } from '../configs/config.js';
import { lge, lgu, lgwc } from './loggerandlocksupportive.js';
import { checkTimeWithNTP, checkTimezone } from './time.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
import { printSectionSeperator } from './others.js';
import { autoCleanUpDatastoreZones } from './datastoresupportive.js';
import { checkCredentialsBlock } from './configvalidation.js';
import { runValidationConfigBookmarksExcel } from './validationsupportive.js';
/* eslint-enable import/extensions */

export default async function commonInit(scriptFilename) {
    /* #region Only make a single instance run of the script. */
    try {
        if (checkSync(scriptFilename, { stale: 15000 })) {
            lgwc('Lock already held, another instace is already running.');
            process.exit(1);
        }
        syncOperationWithErrorHandling(lockSync, scriptFilename, { stale: 15000 });
    } catch (error) {
        lgu('Unable to checkSync or lockSync.', error);
        process.exit(1);
    }
    /* #endregion */

    /* #region Check for timezone and date time is accurate, also auto clean up datastore zones in `downloader.js` or `uploader.js` */
    if (scriptFilename === 'downloader.js' || scriptFilename === 'uploader.js') {
        if (config.environment === 'production') {
            checkTimezone();
            printSectionSeperator();

            await checkTimeWithNTP();
            printSectionSeperator();
        }
        autoCleanUpDatastoreZones();
        printSectionSeperator();
    }
    /* #endregion */

    /* #region Various validation checks  */
    await runValidationConfigBookmarksExcel(scriptFilename, true);
    /* #endregion */

    /* #region Run credentails check and first time encryption in `downloader.js` or `uploader.js` */
    if (scriptFilename === 'downloader.js' || scriptFilename === 'uploader.js') {
        await checkCredentialsBlock();
    }
    /* #endregion */

    if (config.environment !== 'production') {
        lge('Application currently not running in production mode, please switch to production mode immediately.');
    }

    /* #region Start `FolderTransferer.exe` if not started in `downloader.js` or `uploader.js` */
    if (scriptFilename === 'downloader.js' || scriptFilename === 'uploader.js') {
        if (config.environment === 'production' && !checkSync('contractors_folderTransferer.js', { stale: 15000 })) {
            const subprocess = spawn('FolderTransferer.exe', [], {
                detached: true,
                stdio: 'ignore',
            });
            subprocess.unref();
        }
    }
    /* #endregion */
}
