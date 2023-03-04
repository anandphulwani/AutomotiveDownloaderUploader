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

async function removeDir(dirPath, debug = false) {
    await new Promise((resolve, reject) => {
        fs.rm(
            dirPath,
            {
                recursive: true,
                maxRetries: 120,
                retryDelay: 500,
            },
            (error) => {
                if (error) {
                    console.log(chalk.white.bgRed.bold(`Unable to remove a directory : ${dirPath}`));
                    process.exit(1);
                } else {
                    debug ? console.log(`Folder path removed successfully : ${dirPath}`) : '';
                    resolve();
                }
            }
        );
    });
}

async function createDirAndMoveFileFromTempDirToDestination(filePath, tempPath, destinationPath, debug = false) {
    debug ? console.log('Moving file from TempDir to Destination : Executing.') : '';
    await createDirAndMoveFile(filePath, filePath.replace(tempPath, destinationPath), debug);
    debug ? console.log('Moving file from TempDir to Destination : Done.') : '';
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

export { makeDir, moveFile, createDirAndMoveFile, removeDir, createDirAndMoveFileFromTempDirToDestination, generateTempFolderWithRandomText };
