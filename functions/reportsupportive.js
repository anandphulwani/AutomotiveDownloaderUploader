import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { lgc, lge } from './loggersupportive.js';
import { config } from '../configs/config.js';
import { attainLock, releaseLock } from './locksupportive.js';
// import { createBackupOfFile } from './datastoresupportive.js';
import { instanceRunDateFormatted, instanceRunDateWODayFormatted } from './datetime.js';
import { makeDir } from './filesystem.js';
import { setCurrentDealerConfiguration, getDealerNameFromDC } from './excelsupportive.js';
/* eslint-enable import/extensions */

function addAllotmentToReport(allotmentDetails) {
    const reportDateFolder = path.join(config.reportsPath, instanceRunDateWODayFormatted);
    makeDir(reportDateFolder);
    const reportJSONFilePath = path.join(reportDateFolder, `${instanceRunDateFormatted}_report.json`);
    try {
        if (!fs.existsSync(reportJSONFilePath)) {
            const jsonString = JSON.stringify({}, null, 3);
            fs.writeFileSync(reportJSONFilePath, jsonString);
        }
        // createBackupOfFile(fileToOperateOn, newConfigUserContent);
        attainLock(reportJSONFilePath, undefined, true);

        const reportJSONContents = fs.readFileSync(reportJSONFilePath, 'utf8');
        const reportJSONObj = JSON.parse(reportJSONContents);

        let currentUsernamesDealerConfiguration = null;
        // eslint-disable-next-line no-restricted-syntax
        for (const allotmentDetail of allotmentDetails) {
            const allotmentId = allotmentDetail[0];
            const usernameTrimmedAndFolderName = allotmentDetail[1];
            const username = path.dirname(usernameTrimmedAndFolderName);
            const folderName = path.basename(usernameTrimmedAndFolderName);

            if (currentUsernamesDealerConfiguration !== username) {
                setCurrentDealerConfiguration(username);
                currentUsernamesDealerConfiguration = username;
            }
            const dealerName = getDealerNameFromDC(folderName);

            const allotedTo = allotmentDetail[2];
            const qty = allotmentDetail[3];
            reportJSONObj[allotmentId] = {
                isAlloted: true,
                username: username,
                folderName: folderName,
                dealerName: dealerName,
                allotedTo: allotedTo,
                qty: qty,
            };
        }
        const updatedReportJSONObj = JSON.stringify(reportJSONObj, null, 3);
        fs.writeFileSync(reportJSONFilePath, updatedReportJSONObj, 'utf8');
        releaseLock(reportJSONFilePath, undefined, true);
    } catch (err) {
        lgc(err);
        releaseLock(reportJSONFilePath, undefined, true);
        process.exit(1);
    }
}

function addUploadingToReport(uploadingDetail) {
    const reportJSONFilePath = path.join(config.reportsPath, instanceRunDateWODayFormatted, `${instanceRunDateFormatted}_report.json`);
    try {
        if (!fs.existsSync(reportJSONFilePath)) {
            lge(`Todays report json file '${instanceRunDateFormatted}_report.json' was not created while allotment, Exiting.`);
            process.exit(1);
        }
        // createBackupOfFile(fileToOperateOn, newConfigUserContent);
        attainLock(reportJSONFilePath, undefined, true);

        const reportJSONContents = fs.readFileSync(reportJSONFilePath, 'utf8');
        const reportJSONObj = JSON.parse(reportJSONContents);

        const allotmentId = uploadingDetail[0];
        const finishedBy = uploadingDetail[1];
        const doneBy = uploadingDetail[2];

        if (reportJSONObj[allotmentId]) {
            reportJSONObj[allotmentId] = {
                ...reportJSONObj[allotmentId],
                ...{
                    isFinished: true,
                    doneBy: doneBy,
                    finishedBy: finishedBy,
                },
            };
        } else {
            lge(
                `Todays report json file '${instanceRunDateFormatted}_report.json' does not contain a key '${allotmentId}', which should have been created while allotment, Exiting.`
            );
            process.exit(1);
        }
        const updatedReportJSONObj = JSON.stringify(reportJSONObj, null, 3);
        fs.writeFileSync(reportJSONFilePath, updatedReportJSONObj, 'utf8');
        releaseLock(reportJSONFilePath, undefined, true);
    } catch (err) {
        lgc(err);
        releaseLock(reportJSONFilePath, undefined, true);
        process.exit(1);
    }
}

/**
 *
 * Function to add a blank column with the "Additional Images" heading, alternatively ( to write in excel)
 *
 */
function addAdditionalImagesColumnAlternatively(arr) {
    for (let i = 0; i < arr.length; i++) {
        for (let j = arr[i].length; j > 0; j--) {
            // Insert an empty string between elements
            if (j !== 1) {
                if (i === 1) {
                    arr[i].splice(j, 0, arr[i][j - 1]);
                } else if (i === 2) {
                    arr[i].splice(j, 0, 'Additional Images');
                } else {
                    // arr[i].splice(j, 0, ''); // ' '
                }
            }
        }
    }
}

export { addAllotmentToReport, addUploadingToReport, addAdditionalImagesColumnAlternatively };
