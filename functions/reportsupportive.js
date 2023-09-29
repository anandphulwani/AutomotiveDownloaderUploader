import chalk from 'chalk';
import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { lgc } from './loggersupportive.js';
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
            // TODO: Show error here
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
            // TODO: Show error here
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

export { addAllotmentToReport, addUploadingToReport };
