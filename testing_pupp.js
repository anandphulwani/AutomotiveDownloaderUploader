import chalk from 'chalk';
import fs from 'fs';

/* eslint-disable import/extensions */
/* eslint-enable import/extensions */

try {
    const subFoldersAndFiles = fs.readdirSync('F:\\abcde');
    // filteredSubFoldersAndFiles = subFoldersAndFiles.filter((subFolderOrFile) => {
    //     const isDirectory = fs.statSync(`${dirPath}/${subFolderOrFile}`).isDirectory();
    //     return isDirectory && subFolderOrFile.startsWith(startingTxt);
    // });
} catch (err) {
    console.log(err.message);
    console.log(err.errno);
    console.log(err.code);
    // eslint-disable-next-line prefer-regex-literals
    const noSuchFileRegex = new RegExp('ENOENT: no such file or directory.*', 'g');
    if (noSuchFileRegex.test(err.message)) {
        // if (noSuchFileRegex.test('ENOENT: no such file or directory Hello worlds this is atest ')) {
        console.log(chalk.white.bgRed.bold(`getListOfSubfoldersStartingWith${err.message.replace(/^ENOENT: n/, ': N')}`));
    }
    process.exit(1);
}
