import fs from 'fs';
import fsExtra from 'fs-extra';
import mv from 'mv';
import os from 'os';
import chalk from 'chalk';
import path from 'path';
import randomstring from 'randomstring';

/* eslint-disable import/extensions */
import { lgc, lgd, lge, lgs } from './loggerandlocksupportive.js';
import { sleep } from './sleep.js';
/* eslint-enable import/extensions */

function makeDir(dirPath, debug = false) {
    try {
        fs.mkdirSync(dirPath, { recursive: true });
        debug ? lgd(`Folder path created successfully : ${dirPath}`) : null;
    } catch (error) {
        lgc(`Unable to create a directory : ${dirPath}`, error);
        process.exit(1);
    }
}

function moveDirOrFile(fromPath, toPath, overwrite = false, debug = false) {
    // If resource is busy or locked, or operation is not permitted, try for 120 seconds before throwing an error.
    for (let i = 0; i < 30; i++) {
        try {
            const results = fsExtra.moveSync(fromPath, toPath, { overwrite: overwrite, errorOnExist: true });
            debug
                ? lgd(
                      `${'Successfully moved  '}${results}${' files from the \n\tSource Directory: '}${fromPath}\n\t\t\tTo \n\tDestination Directory: ${toPath}`
                  )
                : null;
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
            ? lgd(`Successfully copied  ${results} files from the \n\tSource Directory: ${fromPath}\n\t\t\tTo \n\tDestination Directory: ${toPath}`)
            : null;
    } catch (error) {
        lgc(`${'Unable to copy file from the \n\tSource Directory: '}${fromPath} \n\t\t\tTo \n\tDestination Directory: ${toPath}`, error);
        process.exit(1);
    }
}

function createDirAndMoveFile(fromPath, toPath, overwrite = false, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? lgd(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Executing.`) : null;
        makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? lgd(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Done.`) : null;
    }
    moveDirOrFile(fromPath, toPath, overwrite, debug);
}

function createDirAndCopyFile(fromPath, toPath, overwrite = false, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? lgd(`createDirAndCopyFile function : making directory: ${path.dirname(toPath)} : Executing.`) : null;
        makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? lgd(`createDirAndCopyFile function : making directory: ${path.dirname(toPath)} : Done.`) : null;
    }
    copyDirOrFile(fromPath, toPath, overwrite, debug);
}

function createDirAndMoveFileFromTempDirToDestination(filePath, tempPath, destinationPath, overwrite = false, debug = false) {
    debug ? lgd('Moving file from TempDir to Destination : Executing.') : null;
    createDirAndMoveFile(filePath, filePath.replace(tempPath, destinationPath), overwrite, debug);
    debug ? lgd('Moving file from TempDir to Destination : Done.') : null;
}

function createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(fromPath, toPath, overwrite = false, recursiveDeleteParentLevel = 1, debug = false) {
    createDirAndMoveFile(fromPath, toPath, overwrite, debug);
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
    debug ? lgd('Removing Directory : Executing') : null;
    /* #region : Patch to delete a folder when recursiveDelete is false */
    /**
     * Note: Setting recursiveDelete to true because setting it to false is
     * generating a `Path is a directory: ` error and fs.rmdir is deprecated.
     * This is a nodejs problem.
     */
    if (!recursiveDelete) {
        const dirPathCount = fs.readdirSync(dirPath).length;
        if (dirPathCount > 0) {
            lgs(`Unable to remove the directory, because it is not empty : ${dirPath}`);
            process.exit(1);
        }
        recursiveDelete = true;
    }
    /* #endregion */
    fs.rmSync(dirPath, {
        recursive: recursiveDelete,
        maxRetries: 120,
        retryDelay: 500,
    });
    debug ? lgd('Removing Directory : Done') : null;
}

function removeDirIfExists(dirPath, recursiveDelete = false, debug = false) {
    debug ? lgd('Removing Directory If Exists : Executing') : null;
    if (fs.existsSync(dirPath)) {
        removeDir(dirPath, recursiveDelete, debug);
    }
    debug ? lgd('Removing Directory If Exists: Done') : null;
}

function removeParentDirIfEmpty(dirPath, recursiveDeleteParentLevel = 1, debug = false) {
    const recursiveParentLevel = recursiveDeleteParentLevel !== false ? recursiveDeleteParentLevel : 0;
    // Run it so that it just not traverses above 3 directories
    for (let loopIndex = 0; loopIndex < recursiveParentLevel; loopIndex++) {
        const parentDir = path.dirname(dirPath);
        const parentDirFilesCount = fs.readdirSync(parentDir).length;
        debug
            ? lgd(
                  `parentDir: ${parentDir},    parentDirFilesCount: ${parentDirFilesCount} ${
                      parentDirFilesCount === 0 ? ' (Removing)' : '(Breaking Here)'
                  }`
              )
            : null;
        if (parentDirFilesCount === 0) {
            dirPath = parentDir;
            debug ? lgd(`removeDir ${parentDir}`) : null;
            removeDir(parentDir, false);
        } else {
            debug ? lgd(`Directory (${parentDirFilesCount}) not empty: ${dirPath}`) : null;
            break;
        }
    }
}

function removeDirAndRemoveParentDirIfEmpty(dirPath, recursiveDeleteParentLevel = 1, recursiveDelete = false, debug = false) {
    debug ? lgd('Removing Directory And Removing Parent Directory If Empty : Executing') : null;
    removeDir(dirPath, recursiveDelete, debug);
    removeParentDirIfEmpty(dirPath, recursiveDeleteParentLevel, debug);
    debug ? lgd('Removing Directory And Removing Parent Directory If Empty : Done') : null;
}

function generateTempFolderWithRandomText(debug = false) {
    const randomFolder = randomstring.generate({
        length: 8,
        charset: 'alphabetic',
        capitalization: 'lowercase',
    });
    debug ? lgd(`Generated random folder name : ${randomFolder}`) : null;
    const tempPathWithRandomFolder = `${os.tmpdir()}/${randomFolder}`;
    debug ? lgd(`Temporary path with suffixed random folder : ${tempPathWithRandomFolder}`) : null;
    return tempPathWithRandomFolder;
}

function getFileCountRecursively(dirPath, debug = false) {
    let count = 0;
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        debug ? lgd(`files.length: ${files.length}`) : null;
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
    debug ? lgd(`count: ${count}`) : null;
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
                lgc(`getListOfSubfoldersStartingWith ${err.message.replace(/^ENOENT: n/, ': N')}`, err);
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
    moveDirOrFile,
    copyDirOrFile,
    createDirAndCopyFile,
    createDirAndMoveFile,
    createDirAndMoveFileFromTempDirToDestination,
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty,
    writeFileWithVerification,
    writeFileWithComparingSameLinesWithOldContents,
    removeDir,
    removeDirIfExists,
    removeDirAndRemoveParentDirIfEmpty,
    generateTempFolderWithRandomText,
    getFileCountRecursively,
    getFileCountNonRecursively,
    getListOfSubfoldersStartingWith,
    getFolderSizeInBytes,
};
