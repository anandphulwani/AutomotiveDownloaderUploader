import fs from 'fs';
import mv from 'mv';
import os from 'os';
import chalk from 'chalk';
import path from 'path';
import randomstring from 'randomstring';
import { copySync, moveSync } from 'fs-extra';

/* eslint-disable import/extensions */
import { lgc } from './loggersupportive.js';
/* eslint-enable import/extensions */

async function makeDir(dirPath, debug = false) {
    await new Promise((resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (error) => {
            if (error) {
                lgc(`Unable to create a directory : ${dirPath}`, error);
                process.exit(1);
            } else {
                debug ? console.log(`Folder path created successfully : ${dirPath}`) : '';
                resolve();
            }
        });
    });
}

async function moveFile(fromPath, toPath, debug = false) {
    return new Promise((resolve, reject) => {
        mv(fromPath, toPath, (error) => {
            if (error) {
                lgc(`${'Unable to move file from the \n\tSource Directory: '}${fromPath} \n\t\t\tTo \n\tDestination Directory: ${toPath}`, error);
                process.exit(1);
            } else {
                debug
                    ? console.log(
                          `${'File moved successfully from the \n\tSource Directory: '}${fromPath}\n\t\t\tTo \n\tDestination Directory: ${toPath}`
                      )
                    : '';
                resolve();
            }
        });
    });
}

function copyDirOrFile(fromPath, toPath, debug = false) {
    try {
        const results = copySync(fromPath, toPath, { overwrite: false, errorOnExist: true });
        debug
            ? console.log(
                  `${'Successfully copied  '}${results}${' files from the \n\tSource Directory: '}${fromPath}\n\t\t\tTo \n\tDestination Directory: ${toPath}`
              )
            : '';
    } catch (error) {
        lgc(`${'Unable to copy file from the \n\tSource Directory: '}${fromPath} \n\t\t\tTo \n\tDestination Directory: ${toPath}`, error);
        process.exit(1);
    }
}

async function createDirAndMoveFile(fromPath, toPath, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Executing.`) : '';
        await makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Done.`) : '';
    }
    await moveFile(fromPath, toPath, debug);
}

async function createDirAndCopyFile(fromPath, toPath, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? console.log(`createDirAndCopyFile function : making directory: ${path.dirname(toPath)} : Executing.`) : '';
        await makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? console.log(`createDirAndCopyFile function : making directory: ${path.dirname(toPath)} : Done.`) : '';
    }
    copyDirOrFile(fromPath, toPath, debug);
}

async function createDirAndMoveFileFromTempDirToDestination(filePath, tempPath, destinationPath, debug = false) {
    debug ? console.log('Moving file from TempDir to Destination : Executing.') : '';
    await createDirAndMoveFile(filePath, filePath.replace(tempPath, destinationPath), debug);
    debug ? console.log('Moving file from TempDir to Destination : Done.') : '';
}

async function createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(fromPath, toPath, recursiveDeleteParentLevel = 1, debug = false) {
    await createDirAndMoveFile(fromPath, toPath, debug);
    removeParentDirIfEmpty(fromPath, recursiveDeleteParentLevel, debug);
}

function removeDir(dirPath, recursiveDelete = false, debug = false) {
    debug ? console.log('Removing Directory : Executing') : '';
    /* #region : Patch to delete a folder when recursiveDelete is false */
    /**
     * Note: Setting recursiveDelete to true because setting it to false is
     * generating a `Path is a directory: ` error and fs.rmdir is deprecated.
     * This is a nodejs problem.
     */
    if (!recursiveDelete) {
        const dirPathCount = fs.readdirSync(dirPath).length;
        if (dirPathCount > 0) {
            console.log(chalk.white.bgRed.bold(`Unable to remove the directory, because it is not empty : ${dirPath}`));
            process.exit(1);
        }
        recursiveDelete = true;
    }
    /* #endregion */
    fs.rmSync(
        dirPath,
        {
            recursive: recursiveDelete,
            maxRetries: 120,
            retryDelay: 500,
        },
        (error) => {
            if (error) {
                console.log(chalk.white.bgRed.bold(`Unable to remove a directory : ${dirPath}`));
                process.exit(1);
            } else {
                debug ? console.log(`Folder path removed successfully : ${dirPath}`) : '';
            }
        }
    );
    debug ? console.log('Removing Directory : Done') : '';
}

function removeParentDirIfEmpty(dirPath, recursiveDeleteParentLevel = 1, debug = false) {
    const recursiveParentLevel = recursiveDeleteParentLevel !== false ? recursiveDeleteParentLevel : 0;
    // Run it so that it just not traverses above 3 directories
    for (let loopIndex = 0; loopIndex < recursiveParentLevel; loopIndex++) {
        const parentDir = path.dirname(dirPath);
        const parentDirFilesCount = fs.readdirSync(parentDir).length;
        debug
            ? console.log(
                  `parentDir: ${parentDir},    parentDirFilesCount: ${parentDirFilesCount} ${
                      parentDirFilesCount === 0 ? ' (Removing)' : '(Breaking Here)'
                  }`
              )
            : '';
        if (parentDirFilesCount === 0) {
            dirPath = parentDir;
            debug ? console.log(`removeDir ${parentDir}`) : '';
            removeDir(parentDir, false);
        } else {
            debug ? console.log(`Directory (${parentDirFilesCount}) not empty: ${dirPath}`) : '';
            break;
        }
    }
}

function removeDirAndRemoveParentDirIfEmpty(dirPath, recursiveDeleteParentLevel = 1, recursiveDelete = false, debug = false) {
    debug ? console.log('Removing Directory And Removing Parent Directory If Empty : Executing') : '';
    removeDir(dirPath, recursiveDelete, debug);
    removeParentDirIfEmpty(dirPath, recursiveDeleteParentLevel, debug);
    debug ? console.log('Removing Directory And Removing Parent Directory If Empty : Done') : '';
}

function generateTempFolderWithRandomText(debug = false) {
    const randomFolder = randomstring.generate({
        length: 8,
        charset: 'alphabetic',
        capitalization: 'lowercase',
    });
    debug ? console.log(`Generated random folder name : ${randomFolder}`) : '';
    const tempPathWithRandomFolder = `${os.tmpdir()}/${randomFolder}`;
    debug ? console.log(`Temporary path with suffixed random folder : ${tempPathWithRandomFolder}`) : '';
    return tempPathWithRandomFolder;
}

function getFileCountRecursively(dirPath) {
    let count = 0;
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        // console.log(`files.length${files.length}`);
        // eslint-disable-next-line no-restricted-syntax
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stat = fs.statSync(filePath);
            if (stat.isFile()) {
                count++;
            } else if (stat.isDirectory()) {
                count += getFileCountRecursively(filePath);
            }
        }
    }
    // console.log(`count${count}`);
    return count;
}

function getFileCountNonRecursively(dirPath) {
    let count = 0;
    if (fs.existsSync(dirPath)) {
        fs.readdirSync(dirPath).forEach(() => {
            count++;
        });
    }
    return count;
}

function getListOfSubfoldersStartingWith(dirPath, startingTxt, isStrict = false) {
    let filteredSubFoldersAndFiles = [];
    try {
        const subFoldersAndFiles = fs.readdirSync(dirPath);
        filteredSubFoldersAndFiles = subFoldersAndFiles.filter((subFolderOrFile) => {
            const isDirectory = fs.statSync(`${dirPath}/${subFolderOrFile}`).isDirectory();
            return isDirectory && subFolderOrFile.startsWith(startingTxt);
        });
        filteredSubFoldersAndFiles.sort((a, b) => {
            if (a[1] === b[1]) {
                return 0;
            }
            return a[1] > b[1] ? -1 : 1;
        });
        return filteredSubFoldersAndFiles;
    } catch (err) {
        // eslint-disable-next-line prefer-regex-literals
        const noSuchFileRegex = new RegExp('ENOENT: no such file or directory.*', 'g');
        if (noSuchFileRegex.test(err.message)) {
            if (isStrict) {
                console.log(chalk.white.bgRed.bold(`getListOfSubfoldersStartingWith${err.message.replace(/^ENOENT: n/, ': N')}`));
                process.exit(1);
            }
        } else {
            throw err;
        }
    }
    return filteredSubFoldersAndFiles;
}

function getFolderSizeInBytes(folderPath) {
    let totalSize = 0;
    const files = fs.readdirSync(folderPath);
    // eslint-disable-next-line no-restricted-syntax
    for (const file of files) {
        const filePath = path.join(folderPath, file);
        const stat = fs.statSync(filePath);
        if (stat.isFile()) {
            totalSize += stat.size;
        } else if (stat.isDirectory()) {
            totalSize += getFolderSizeInBytes(filePath);
        }
    }
    return totalSize;
}

export {
    makeDir,
    moveFile,
    copyDirOrFile,
    createDirAndCopyFile,
    createDirAndMoveFile,
    createDirAndMoveFileFromTempDirToDestination,
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty,
    removeDir,
    removeDirAndRemoveParentDirIfEmpty,
    generateTempFolderWithRandomText,
    getFileCountRecursively,
    getFileCountNonRecursively,
    getListOfSubfoldersStartingWith,
    getFolderSizeInBytes,
};
