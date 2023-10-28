import fs from 'fs';
import fsExtra from 'fs-extra';
import mv from 'mv';
import os from 'os';
import chalk from 'chalk';
import path from 'path';
import randomstring from 'randomstring';

/* eslint-disable import/extensions */
import { lgc } from './loggersupportive.js';
import { sleep } from './sleep.js';
/* eslint-enable import/extensions */

function makeDir(dirPath, debug = false) {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        debug ? console.log(`Folder path created successfully : ${dirPath}`) : '';
    } catch (error) {
        lgc(`Unable to create a directory : ${dirPath}`, error);
        process.exit(1);
    }
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

function moveDirOrFile(fromPath, toPath, overwrite = false, debug = false) {
    // If resource is busy or locked, or operation is not permitted, try for 120 seconds before throwing an error.
    for (let i = 0; i < 30; i++) {
        try {
            const results = fsExtra.moveSync(fromPath, toPath, { overwrite: overwrite, errorOnExist: true });
            debug
                ? console.log(
                      `${'Successfully moved  '}${results}${' files from the \n\tSource Directory: '}${fromPath}\n\t\t\tTo \n\tDestination Directory: ${toPath}`
                  )
                : '';
            break;
        } catch (error) {
            if (
                i < 29 &&
                (error.message.trim().startsWith('EPERM: operation not permitted, ') ||
                    error.message.trim().startsWith('EBUSY: resource busy or locked, '))
            ) {
                sleep(4);
            } else {
                lgc(`${'Unable to move file from the \n\tSource Directory: '}${fromPath} \n\t\t\tTo \n\tDestination Directory: ${toPath}`, error);
                process.exit(1);
            }
        }
    }
}

function copyDirOrFile(fromPath, toPath, overwrite = false, debug = false) {
    try {
        const results = fsExtra.copySync(fromPath, toPath, { overwrite: overwrite, errorOnExist: true });
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

function createDirAndMoveFile(fromPath, toPath, overwrite = false, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Executing.`) : '';
        makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Done.`) : '';
    }
    moveDirOrFile(fromPath, toPath, overwrite, debug);
}

function createDirAndCopyFile(fromPath, toPath, overwrite = false, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? console.log(`createDirAndCopyFile function : making directory: ${path.dirname(toPath)} : Executing.`) : '';
        makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? console.log(`createDirAndCopyFile function : making directory: ${path.dirname(toPath)} : Done.`) : '';
    }
    copyDirOrFile(fromPath, toPath, overwrite, debug);
}

function createDirAndMoveFileFromTempDirToDestination(filePath, tempPath, destinationPath, debug = false) {
    debug ? console.log('Moving file from TempDir to Destination : Executing.') : '';
    createDirAndMoveFile(filePath, filePath.replace(tempPath, destinationPath), debug);
    debug ? console.log('Moving file from TempDir to Destination : Done.') : '';
}

function createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(fromPath, toPath, recursiveDeleteParentLevel = 1, debug = false) {
    createDirAndMoveFile(fromPath, toPath, debug);
    removeParentDirIfEmpty(fromPath, recursiveDeleteParentLevel, debug);
}

function writeFileWithVerification(pathOfFile, fileContents, noOfLines = -1, noOfLinesComparison = '=', isTrim = false) {
    fs.writeFileSync(`${pathOfFile}.tempToVerify`, fileContents);
    if (fs.existsSync(`${pathOfFile}.tempToVerify`)) {
        let tempToVerifyContents = fs.readFileSync(`${pathOfFile}.tempToVerify`, 'utf8');
        if (isTrim) {
            tempToVerifyContents = tempToVerifyContents.trim();
        }
        let comparisonResult = true;
        if (noOfLines >= 0) {
            const tempToVerifyNoOfLines = tempToVerifyContents.split(/\r\n|\r|\n/).length;
            if (noOfLinesComparison === '=') {
                comparisonResult = tempToVerifyNoOfLines === noOfLines;
            } else if (noOfLinesComparison === '>') {
                comparisonResult = tempToVerifyNoOfLines > noOfLines;
            } else if (noOfLinesComparison === '>=') {
                comparisonResult = tempToVerifyNoOfLines >= noOfLines;
            } else if (noOfLinesComparison === '<') {
                comparisonResult = tempToVerifyNoOfLines < noOfLines;
            } else if (noOfLinesComparison === '<=') {
                comparisonResult = tempToVerifyNoOfLines <= noOfLines;
            }
        }
        if (comparisonResult && tempToVerifyContents === fileContents) {
            fs.renameSync(`${pathOfFile}.tempToVerify`, pathOfFile);
            if (fs.existsSync(pathOfFile) && !fs.existsSync(`${pathOfFile}.tempToVerify`)) {
                return true;
            }
            return false;
        }
        fs.unlinkSync(`${pathOfFile}.tempToVerify`);
    }
    return false;
}

function writeFileWithComparingSameLinesWithOldContents(pathOfFile, fileContents, fileOldContents) {
    const noOfLinesOldContent = fileOldContents.trim().split(/\r\n|\r|\n/).length;
    return writeFileWithVerification(pathOfFile, fileContents, noOfLinesOldContent, '=', true);
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
    writeFileWithVerification,
    writeFileWithComparingSameLinesWithOldContents,
    removeDir,
    removeDirAndRemoveParentDirIfEmpty,
    generateTempFolderWithRandomText,
    getFileCountRecursively,
    getFileCountNonRecursively,
    getListOfSubfoldersStartingWith,
    getFolderSizeInBytes,
};
