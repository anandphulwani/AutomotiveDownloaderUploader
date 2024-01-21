import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { moveDirOrFile, createDirAndMoveFileFromTempDirToDestination, getFileCountRecursively } from './filesystem.js';
import { lgd, lgi, lgu } from './loggerandlocksupportive.js';
import Color from '../class/Colors.js';
import LineSeparator from '../class/LineSeparator.js';
import LoggingPrefix from '../class/LoggingPrefix.js';
import syncOperationWithErrorHandling from './syncOperationWithErrorHandling.js';
import { getUsernameTrimmed } from './excelsupportive.js';
import { config } from '../configs/config.js';
import { instanceRunDateFormatted } from './datetime.js';
import { zeroPad } from './stringformatting.js';
/* eslint-enable import/extensions */

async function getChecksumFromURL(url, hashAlgo, debug = false) {
    return new Promise((resolve, reject) => {
        const body = [];
        const getOperation = https.get(url, (response) => {
            response.on('data', (chunk) => body.push(chunk));
            response.on('end', async () => {
                if (response.statusCode === 200) {
                    const hashSum = crypto.createHash(hashAlgo);
                    hashSum.update(Buffer.concat(body));
                    const checksumOfFile = hashSum.digest('hex');
                    resolve(checksumOfFile);
                } else {
                    lgu(`Unable to calculate checksum of the file: ${url}`);
                    process.exit(1);
                }
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
        getOperation.on('error', (err) => {
            reject(err);
        });
        getOperation.setTimeout(10000, () => {
            getOperation.destroy();
        });
    });
}

async function downloadFileAndCompareWithChecksum(
    url,
    file,
    tempPath,
    destinationPath,
    isSingleImage,
    hashAlgo,
    checksumOfFile,
    shortFilenameTextLength,
    debug = false
) {
    return new Promise((resolve, reject) => {
        const getOperation = https.get(url, (response) => {
            response.pipe(file);
            file.on('finish', async () => {
                // after download completed close filestream
                file.close();

                const fileBuffer = syncOperationWithErrorHandling(fs.readFileSync, file.path);
                const hashSum = crypto.createHash(hashAlgo);
                hashSum.update(fileBuffer);
                if (checksumOfFile === hashSum.digest('hex')) {
                    let filePath = file.path;
                    if (isSingleImage) {
                        /**
                         * If it's a single image, then get the VIN Number from the path name, and replace the filename
                         * which is usually 01.jpg, 02.jpg...... likewise, to VINNumber.jpg, for that we need to
                         * firstly: moveDirOrFile(rename) 01.jpg to VINNumber.jpg in the directory where the file is currently present
                         * secondly: we have to alter the destinationpath from `somepath/VINNumber/01.jpg` to `somepath/VINNumber.jpg`
                         * so that the file can be moved without the VINNumber as directory.
                         */
                        const newFilePath = `${path.dirname(filePath)}/${path.basename(destinationPath)}${path.extname(path.basename(filePath))}`;
                        destinationPath = `${path.dirname(destinationPath)}/`;
                        moveDirOrFile(filePath, newFilePath, true, debug);
                        filePath = newFilePath;
                    }
                    createDirAndMoveFileFromTempDirToDestination(filePath, `${tempPath}/`, destinationPath, true, debug);
                    debug
                        ? lgd(`Download Completed, File saved as : ${destinationPath}${path.basename(filePath)}`, Color.green)
                        : lgi(
                              ` ${logSymbols.success}${' '.repeat(38 - shortFilenameTextLength > 0 ? 38 - shortFilenameTextLength : 0)}`,
                              LoggingPrefix.false,
                              LineSeparator.false
                          );
                }
                resolve();
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
        getOperation.on('error', (err) => {
            reject(err);
        });
        getOperation.setTimeout(10000, () => {
            getOperation.destroy();
        });
    });
}

const allUsernamesFromConfig = config.credentials.map((item) => item.username);
function getCurrentLotDetails(lotIndex) {
    let dealerFolderCntInLot = 0;
    let imagesQtyInLot = 0;

    const lotFolder = path.join(config.downloadPath, instanceRunDateFormatted, `Lot_${zeroPad(lotIndex, 2)}`);

    if (syncOperationWithErrorHandling(fs.existsSync, lotFolder)) {
        // eslint-disable-next-line no-restricted-syntax
        for (const usernameFromConfig of allUsernamesFromConfig) {
            const usernameTrimmed = getUsernameTrimmed(usernameFromConfig);
            const lotFolderAndUsername = path.join(lotFolder, usernameTrimmed);
            if (syncOperationWithErrorHandling(fs.existsSync, lotFolderAndUsername)) {
                // eslint-disable-next-line no-restricted-syntax
                for (const dealerLevelFolderOrFile of syncOperationWithErrorHandling(fs.readdirSync, lotFolderAndUsername)) {
                    const dealerLevelFolderOrFileFullPath = path.join(lotFolderAndUsername, dealerLevelFolderOrFile);
                    if (!syncOperationWithErrorHandling(fs.statSync, dealerLevelFolderOrFileFullPath).isDirectory()) {
                        // eslint-disable-next-line no-continue
                        continue;
                    }
                    imagesQtyInLot += getFileCountRecursively(dealerLevelFolderOrFileFullPath);
                    dealerFolderCntInLot++;
                }
            }
        }
    }
    return { dealerFolderCntInLot, imagesQtyInLot };
}

export { getChecksumFromURL, downloadFileAndCompareWithChecksum, getCurrentLotDetails };
