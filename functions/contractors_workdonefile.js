import fs from 'fs';
import path from 'path';

/* eslint-disable import/extensions */
import { instanceRunDateFormatted, instanceRunDateWODayFormatted } from './datetime.js';
import { config } from '../configs/config.js';
import { getRemainingBookmarksNotDownloadedLength } from './bookmarksupportive.js';
/* eslint-enable import/extensions */

const cuttingDoneFolderName = config.cutterProcessingFolders[0];
const finishingBufferFolderName = config.finisherProcessingFolders[0];
const readyToUploadFolderName = config.finisherProcessingFolders[1];

const cuttersCompletedAndDoneFileCreated = [];
function checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer() {
    // Check if JSON file of report exists, because that means some download is done and the first lot is allotted.
    const reportDateFolder = path.join(config.reportsPath, 'jsondata', instanceRunDateWODayFormatted);
    const reportJSONFilePath = path.join(reportDateFolder, `${instanceRunDateFormatted}_report.json`);
    if (!fs.existsSync(reportJSONFilePath)) {
        return;
    }

    /**
     * Ignore if Bookmarks file contains some URLs which are not downloaded yet.
     */
    const remainingBookmarksNotDownloadedLength = getRemainingBookmarksNotDownloadedLength();
    if (remainingBookmarksNotDownloadedLength !== 0) {
        return;
    }

    /**
     * Ignore if downloadPath/TodaysDate contains some data.
     */
    const downloadPathWithTodaysDate = `${config.downloadPath}\\${instanceRunDateFormatted}`;
    if (fs.existsSync(downloadPathWithTodaysDate) && fs.readdirSync(downloadPathWithTodaysDate).length !== 0) {
        return;
    }

    // eslint-disable-next-line no-restricted-syntax
    for (const contractor of Object.keys(config.contractors)) {
        const allWorkDoneFile = `${contractor}_${instanceRunDateFormatted}.txt`;
        /**
         * Ignore `contractor` if it the file is created, i.e. its filename is already present `cuttersCompletedAndDoneFileCreated`.
         */
        if (cuttersCompletedAndDoneFileCreated.includes(allWorkDoneFile)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore `contractor` if its contractorsZonePath is not present.
         */
        const contractorPath = path.join(config.contractorsZonePath, contractor, instanceRunDateFormatted);
        if (!fs.existsSync(contractorPath)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore if contractorZonePath contains files allotted are already present, i.e. folders except
         * cuttingDoneFolderName, finishingBufferFolderName, readyToUploadFolderName
         */
        let contractorPathFiles = fs.readdirSync(contractorPath);
        contractorPathFiles = contractorPathFiles.filter(
            (filename) => ![cuttingDoneFolderName, finishingBufferFolderName, readyToUploadFolderName].includes(filename)
        );
        if (contractorPathFiles.length !== 0) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore `contractor` if its contractors cuttingDone folder is not present.
         */
        const contractorPathCuttingDone = path.join(config.contractorsZonePath, contractor, instanceRunDateFormatted, cuttingDoneFolderName);
        if (!fs.existsSync(contractorPath)) {
            // eslint-disable-next-line no-continue
            continue;
        }
        /**
         * Ignore `contractor` if its contractors cuttingDone folder has files present in the cuttingDone folder.
         */
        const contractorPathCuttingDoneFiles = fs.readdirSync(contractorPathCuttingDone);
        if (contractorPathCuttingDoneFiles.length !== 0) {
            // eslint-disable-next-line no-continue
            continue;
        }
        const cuttersFinisher = config.contractors[contractor].finisher;
        const cuttersFinishersFinishingBufferPath = path.join(
            config.contractorsZonePath,
            cuttersFinisher,
            instanceRunDateFormatted,
            finishingBufferFolderName
        );
        const allWorkDoneFileFullPath = path.join(cuttersFinishersFinishingBufferPath, allWorkDoneFile);
        if (!fs.existsSync(allWorkDoneFileFullPath)) {
            fs.closeSync(fs.openSync(allWorkDoneFileFullPath, 'a'));
            cuttersCompletedAndDoneFileCreated.push(allWorkDoneFile);
        }
    }
}

export default checkIfCuttingWorkDoneAndCreateDoneFileInFinishingBuffer;
