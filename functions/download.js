import https from 'https';
import crypto from 'crypto';
import fs from 'fs';
import chalk from 'chalk';
import path from 'path';
import logSymbols from 'log-symbols';
// eslint-disable-next-line import/extensions
import { makeDir, moveFile, createDirAndMoveFile, removeDir, createDirAndMoveFileFromTempDirToDestination } from './filesystem.js';

async function getChecksumFromURL(url, hashAlgo, debug = false) {
    return new Promise((resolve, reject) => {
        const body = [];
        https.get(url, (response) => {
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
    });
}

async function downloadFileAndCompareWithChecksum(url, file, tempPath, destinationPath, isSingleImage, hashAlgo, checksumOfFile, debug = false) {
    return new Promise((resolve, reject) => {
        https.get(url, (response) => {
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
                        await moveFile(filePath, newFilePath, debug);
                        filePath = newFilePath;
                    }
                    await createDirAndMoveFileFromTempDirToDestination(filePath, `${tempPath}/`, destinationPath, debug);
                    debug
                        ? console.log(chalk.green.bold(`Download Completed, File saved as : ${destinationPath}${path.basename(filePath)}`))
                        : process.stdout.write(chalk.green.bold(` ${logSymbols.success}         `));
                }
                resolve();
            });
            response.on('error', (error) => {
                reject(error);
            });
        });
    });
}

export { getChecksumFromURL, downloadFileAndCompareWithChecksum };
