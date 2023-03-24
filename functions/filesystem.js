import fs from 'fs';
import os from 'os';
import chalk from 'chalk';
import path from 'path';
import randomstring from 'randomstring';

async function makeDir(dirPath, debug = false) {
    await new Promise((resolve, reject) => {
        fs.mkdir(dirPath, { recursive: true }, (error) => {
            if (error) {
                console.log(chalk.white.bgRed.bold(`Unable to create a directory : ${dirPath}`));
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
        fs.rename(fromPath, toPath, (error) => {
            if (error) {
                console.log(
                    chalk.white.bgRed.bold(
                        `${'Unable to move file from the \n\tSource Directory: '}${fromPath} \n\t\t\tTo \n\tDestination Directory: ${toPath}`
                    )
                );
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

async function createDirAndMoveFile(fromPath, toPath, debug = false) {
    if (!fs.existsSync(path.dirname(toPath))) {
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Executing.`) : '';
        await makeDir(`${path.dirname(toPath)}/`, debug);
        debug ? console.log(`createDirAndMoveFile function : making directory: ${path.dirname(toPath)} : Done.`) : '';
    }
    await moveFile(fromPath, toPath, debug);
}

async function createDirAndMoveFileFromTempDirToDestination(filePath, tempPath, destinationPath, debug = false) {
    debug ? console.log('Moving file from TempDir to Destination : Executing.') : '';
    await createDirAndMoveFile(filePath, filePath.replace(tempPath, destinationPath), debug);
    debug ? console.log('Moving file from TempDir to Destination : Done.') : '';
}

async function createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty(fromPath, toPath, recursiveDeleteParentLevel = false, debug = false) {
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

function removeParentDirIfEmpty(dirPath, recursiveDeleteParentLevel = false, debug = false) {
    const recursiveParentLevel = recursiveDeleteParentLevel !== false ? recursiveDeleteParentLevel : 1;
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

function removeDirAndRemoveParentDirIfEmpty(dirPath, recursiveDeleteParentLevel = false, recursiveDelete = false, debug = false) {
    debug ? console.log('Removing Directory And Removing Parent Directory If Empty : Executing') : '';
    removeDir(dirPath, recursiveDelete, true);
    removeParentDirIfEmpty(dirPath, recursiveDeleteParentLevel, true);
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
    // console.log(`count${count}`);
    return count;
}

export {
    makeDir,
    moveFile,
    createDirAndMoveFileFromTempDirToDestination,
    createDirAndMoveFileAndDeleteSourceParentFolderIfEmpty,
    removeDir,
    removeDirAndRemoveParentDirIfEmpty,
    generateTempFolderWithRandomText,
    getFileCountRecursively,
};
