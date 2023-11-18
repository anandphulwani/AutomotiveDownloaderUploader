import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { moveDirOrFile, createDirAndMoveFileFromTempDirToDestination } from './filesystem.js';
import { lgi, lgu } from './loggersupportive.js';
import Color from '../class/Colors.js';
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
        // getOperation.setTimeout(Math.floor(Math.random() * (60 - 50)) + 50, () => {
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

                const fileBuffer = fs.readFileSync(file.path);
                const hashSum = crypto.createHash(hashAlgo);
                hashSum.update(fileBuffer);
                if (checksumOfFile === hashSum.digest('hex')) {
                    let filePath = file.path;
                    if (isSingleImage) {
                        const newFilePath = `${path.dirname(filePath)}/${path.basename(destinationPath)}${path.extname(path.basename(filePath))}`;
                        destinationPath = `${path.dirname(destinationPath)}/`;
                        moveDirOrFile(filePath, newFilePath, true, debug);
                        filePath = newFilePath;
                    }
                    createDirAndMoveFileFromTempDirToDestination(filePath, `${tempPath}/`, destinationPath, true, debug);
                    debug
                        ? console.log(chalk.green.bold(`Download Completed, File saved as : ${destinationPath}${path.basename(filePath)}`))
                        : lgi(
                              ` ${logSymbols.success}${' '.repeat(38 - shortFilenameTextLength > 0 ? 38 - shortFilenameTextLength : 0)}`,
                              Color.green,
                              false
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
        // getOperation.setTimeout(Math.floor(Math.random() * (60 - 50)) + 50, () => {
        getOperation.setTimeout(10000, () => {
            getOperation.destroy();
        });
    });
}

export { getChecksumFromURL, downloadFileAndCompareWithChecksum };
