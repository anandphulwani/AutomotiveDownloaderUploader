import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import logSymbols from 'log-symbols';

/* eslint-disable import/extensions */
import { moveDirOrFile, createDirAndMoveFileFromTempDirToDestination } from './filesystem.js';
import { lgvf } from './loggersupportive.js';
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
                    console.log(chalk.white.bgRed.bold(`Unable to calculate checksum of the file: ${url}`));
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
                    lgvf('============================================BLOCK START============================================');
                    if (isSingleImage) {
                        lgvf('==============IS SINGLE IMAGE START==============');
                        lgvf(`Original filePath: ${filePath}`);
                        lgvf(`Original destinationPath: ${destinationPath}`);
                        const newFilePath = `${path.dirname(filePath)}/${path.basename(destinationPath)}${path.extname(path.basename(filePath))}`;
                        lgvf(`Mod newFilePath: ${newFilePath}`);
                        destinationPath = `${path.dirname(destinationPath)}/`;
                        lgvf(`Mod destinationPath: ${destinationPath}`);
                        lgvf(`does filePath Exists: ${fs.existsSync(filePath)}`);
                        moveDirOrFile(filePath, newFilePath, true, debug);
                        filePath = newFilePath;
                        lgvf(`Exit filePath: ${filePath}`);
                        lgvf('==============IS SINGLE IMAGE END==============');
                    }
                    lgvf('==============OUTSIDE IF BLOCK START==============');
                    lgvf(`Original filePath: ${filePath}`);
                    lgvf(`Original tempPath: ${tempPath}/`);
                    lgvf(`Original destinationPath: ${destinationPath}`);
                    lgvf(`does filePath Exists: ${fs.existsSync(filePath)}`);
                    createDirAndMoveFileFromTempDirToDestination(filePath, `${tempPath}/`, destinationPath, true, debug);
                    lgvf('==============OUTSIDE IF BLOCK END==============');
                    lgvf('============================================BLOCK END============================================');
                    debug
                        ? console.log(chalk.green.bold(`Download Completed, File saved as : ${destinationPath}${path.basename(filePath)}`))
                        : process.stdout.write(
                              chalk.green.bold(
                                  ` ${logSymbols.success}${' '.repeat(38 - shortFilenameTextLength > 0 ? 38 - shortFilenameTextLength : 0)}`
                              )
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
